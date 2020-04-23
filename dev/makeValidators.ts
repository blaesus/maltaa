import * as fs from "fs";
import * as path from "path"
import * as ts from "typescript";

type PrimitiveType = {
    kind: "primitive",
    primitive: "string" | "number" | "boolean" | "undefined"
}

type StringLiteralType = {
    kind: "string-literal",
    value: string,
}

type ArrayType = {
    kind: "array",
    element: TypeLike,
}

interface UnionType {
    kind: "union",
    name: string,
    types: TypeLike[],
}

type GenericType = {
    kind: "generic",
    baseType: TypeReference,
    parameters: TypeLike[],
}

type Type = PrimitiveType | StringLiteralType | ArrayType | UnionType | GenericType;

type TypeReference = {
    kind: "reference",
    reference: {
        identifier: string,
    },
}

type TypeLike = Type | TypeReference;

type InterfaceFields = {
    [key in string]: TypeLike;
}

interface InterfaceDeclaration {
    kind: "interface",
    name: string,
    fields: InterfaceFields
}

type TypeAliasDeclaration = {
    kind: "alias",
    name: string,
    meaning: TypeLike
};

type Declaration = InterfaceDeclaration | TypeAliasDeclaration;

function prepropcess(entryFileName: string): {entrySourceText: string, combinedSourceText: string} {
    const entrySourceText = fs.readFileSync(entryFileName).toString();
    const entrySource = ts.createSourceFile("root.ts", entrySourceText, ts.ScriptTarget.ES2019)

    let combinedSourceText: string = entrySourceText;
    entrySource.forEachChild(node => {
        if (node.kind === ts.SyntaxKind.ImportDeclaration) {
            node.forEachChild(child => {
                if (child.kind === ts.SyntaxKind.StringLiteral) {
                    const pathReference = child.getText(entrySource).replace(/"/g, "");
                    const newPath = path.join(path.dirname(entryFileName), pathReference) + ".ts"
                    const newText = fs.readFileSync(newPath).toString();
                    combinedSourceText = `${newText}\n${combinedSourceText}`;
                }
            })
        }
    })
    return {entrySourceText, combinedSourceText};
}

function extractValueType(
    node: ts.Node, source: ts.SourceFile
): Type | TypeReference | null {
    switch (node.kind) {
        case ts.SyntaxKind.StringKeyword: {
            return {kind: "primitive", primitive: "string"};
        }
        case ts.SyntaxKind.NumberKeyword: {
            return {kind: "primitive", primitive: "number"};
        }
        case ts.SyntaxKind.BooleanKeyword: {
            return {kind: "primitive", primitive: "boolean"};
        }
        case ts.SyntaxKind.TypeReference: {
            let identifier = "";
            let parameters: TypeLike[] = [];
            node.forEachChild(child => {
                switch (child.kind) {
                    case ts.SyntaxKind.Identifier: {
                        identifier = child.getText(source);
                        break;
                    }
                    case ts.SyntaxKind.TypeReference: {
                        parameters.push({
                            kind: "reference",
                            reference: {
                                identifier: child.getText(source)
                            }
                        })
                        break;
                    }
                    case ts.SyntaxKind.UnionType: {
                        parameters.push(extractUnion(child, source, "union"))
                    }
                }
            })
            if (!parameters.length) {
                return {
                    kind: "reference",
                    reference: {
                        identifier,
                    },
                };
            }
            else {
                return {
                    kind: "generic",
                    baseType: {
                        kind: "reference",
                        reference: {
                            identifier,
                        }
                    },
                    parameters,
                };
            }
        }
        case ts.SyntaxKind.LiteralType: {
            return {
                kind: "string-literal",
                value: node.getText(source),
            };
        }
        case ts.SyntaxKind.ArrayType: {
            let grandChild
            node.forEachChild(candidate => {
                grandChild = candidate;
            })
            if (grandChild) {
                const value = extractValueType(grandChild, source);
                if (value && typeof value === "object") {
                    return {
                        kind: "array",
                        element: value,
                    };
                }
            }
            return null;
        }
        default: {
            return null;
        }
    }
}


function extractKey(
    node: ts.Node, source: ts.SourceFile
): string | null {
    switch (node.kind) {
        case ts.SyntaxKind.Identifier: {
            return node.getText(source)
        }
        default: {
            return null;
        }
    }
}

function extractPropertySignature(rootNode: ts.Node, source: ts.SourceFile): InterfaceFields {
    let key: string = "";
    const fields: InterfaceFields = {}
    rootNode.forEachChild(nextLevelNode => {
        const possibleKey = extractKey(nextLevelNode, source);
        if (possibleKey) {
            key = possibleKey;
        }
        const value = extractValueType(nextLevelNode, source);
        if (value) {
            fields[key] = value;
        }
        else {
            return;
        }
    });
    return fields;
}

function extractUnion(node: ts.Node, source: ts.SourceFile, name: string): UnionType {
    let types: Type[] = [];
    node.forEachChild(child => {
        types.push({
            kind: "string-literal",
            value: child.getText(source),
        });
    });
    return {
        kind: "union",
        name,
        types,
    }
}

function extractDeclarations(entryFileName: string): Declaration[] {
    const {entrySourceText, combinedSourceText} = prepropcess(entryFileName);
    const source = ts.createSourceFile("test.ts", entrySourceText, ts.ScriptTarget.ES2019)
    const combinedSource = ts.createSourceFile("combined.ts", combinedSourceText, ts.ScriptTarget.ES2019)
    const declarations: Declaration[] = [];
    combinedSource.forEachChild(firstLevelNode => {
        switch (firstLevelNode.kind) {
            case ts.SyntaxKind.InterfaceDeclaration: {
                const declaration: Declaration = {kind: "interface", name: "", fields: {}};
                firstLevelNode.forEachChild(secondLevelNode => {
                    if (secondLevelNode.kind === ts.SyntaxKind.Identifier) {
                        declaration.name = secondLevelNode.getText(combinedSource);
                    }
                    else if (secondLevelNode.kind === ts.SyntaxKind.PropertySignature) {
                        const keyvalues = extractPropertySignature(secondLevelNode, combinedSource);
                        declaration.fields = {
                            ...declaration.fields,
                            ...keyvalues
                        };
                    }
                });
                declarations.push(declaration);
                break;
            }
            case ts.SyntaxKind.TypeAliasDeclaration: {
                let name: string = "";
                let meaning: TypeLike | null = null;
                firstLevelNode.forEachChild(child => {
                    if (child.kind === ts.SyntaxKind.Identifier) {
                        name = child.getText(combinedSource);
                    }
                    else if (child.kind === ts.SyntaxKind.UnionType) {
                        meaning = extractUnion(
                            child,
                            combinedSource,
                            name,
                        );
                    }
                    else if (child.kind === ts.SyntaxKind.StringKeyword) {
                        meaning = {
                            kind: "primitive",
                            primitive: "string",
                        };
                    }
                    else if (child.kind === ts.SyntaxKind.TypeReference) {
                        meaning = extractValueType(child, combinedSource);
                    }
                });
                if (meaning) {
                    declarations.push({
                        kind: "alias",
                        name,
                        meaning,
                    });
                }
                break;
            }
            default: {
                // No-op
            }
        }
    });
    return declarations;
}

const literalValidator = `
function is(valueA: any): (value: any) => boolean {
  return function(valueB: any): boolean {
    return valueB === valueA;
  }
}
function isArray(filter: (data: any) => boolean): (value: any) => boolean {
  return function(value: any): boolean {
      if (!Array.isArray(value)) {
        return false;
      }
      return value.every(filter);
  }
}
`

const primitiveValidators = `
function isstring(data: any): boolean {
    return typeof data === "string";
}
function isnumber(data: any): boolean {
    return typeof data === "number";
}
function isboolean(data: any): boolean {
    return typeof data === "boolean";
}
function isundefined(data: any): boolean {
    return typeof data === "undefined";
}
`

function InlineGenerics(declarations: Declaration[]): Declaration[] {
    const result = [];
    for (const d of declarations) {
        let canPass = true;
        if (d.kind === "interface") {
            for (const field of Object.entries(d.fields)) {
                const [key, value] = field;
                if (value.kind === "generic") {
                    const baseIdentifier = value.baseType.reference.identifier;
                    switch (baseIdentifier) {
                        case "Partial": {
                            const firstParameter = value.parameters[0];
                            if (firstParameter && firstParameter.kind === "reference") {
                                const targetType = declarations.find(d => d.name === firstParameter.reference.identifier)
                                if (targetType && targetType.kind === "interface") {
                                    const replacement: InterfaceDeclaration = JSON.parse(JSON.stringify(d));
                                    canPass = false;
                                    const partialDeclaration: InterfaceDeclaration = {
                                        kind: "interface",
                                        name: "Partial" + targetType.name,
                                        fields: {}
                                    };
                                    for (const entry of Object.entries(targetType.fields)) {
                                        const [key, value] = entry;
                                        partialDeclaration.fields[key] = {
                                            kind: "union",
                                            name: "",
                                            types: [
                                                {
                                                    kind: "primitive",
                                                    primitive: "undefined",
                                                },
                                                value
                                            ],
                                        };
                                    }
                                    replacement.fields[key] = {
                                        kind: "reference",
                                        reference: {
                                            identifier: partialDeclaration.name,
                                        }
                                    }
                                    result.push(replacement);
                                    result.push(partialDeclaration);
                                }
                            }
                            break;
                        }
                        default: {
                            console.warn("Generic not implemented")
                        }
                    }

                }
                else {
                }
            }
        }
        else if (d.kind === "alias") {
            // NOT_IMPLEMENTED
        }
        if (canPass) {
            result.push(d);
        }
    }
    return result;

}

function compile(declarations: Declaration[]): string {
    let result = `${literalValidator}${primitiveValidators}`;

    function getValidatorFnName(type: TypeLike): string {
        if (type.kind === "primitive") {
            return `is${type.primitive}`;
        }
        else if (type.kind === "reference") {
            return `is${type.reference.identifier}`;
        }
        else if (type.kind === "array") {
            return `isArray(${getValidatorFnName(type.element)})`
        }
        else {
            return `__UNIMPLEMENTED`
        }
    }

    function getTypeValidateClause(key: string, type: TypeLike): string {
        if (type.kind === "primitive" || type.kind === "reference" || type.kind === "array") {
            return `
    if (!${getValidatorFnName(type)}(data.${key})) {
        return false;
    }
            `
        }
        else if (type.kind === "string-literal") {
            return `
    if (data.${key} !== ${type.value}) {
        return false;
    }
            `
        }
        else if (type.kind === "union") {
            return `
    if (!(${getUnionClause(type)})) {
        return false;
    }
            `
        }
        return `FAILED ${type.kind}`
    }

    function getUnionClause(union: UnionType) {
        return union.types.map(type => {
                        switch (type.kind) {
                            case "primitive": {
                                return `is${type.primitive}(data)`
                            }
                            case "string-literal": {
                                if (type.value.startsWith(`"`)) {
                                    return `is(${type.value})(data)`
                                }
                                else {
                                    return `is${type.value}(data)`
                                }
                            }
                            default: {
                                return true;
                            }
                        }
                    }).join("\n    ||")
    }

    for (const declaration of declarations) {
        switch (declaration.kind) {
            case "alias": {
                if (declaration.meaning.kind === "primitive") {
                    result += `const is${declaration.name} = is${declaration.meaning.primitive};`
                }
                else if (declaration.meaning.kind === "reference") {
                    result += `const is${declaration.name} = is${declaration.meaning.reference.identifier};`
                }
                else if (declaration.meaning.kind === "union") {
                    result += `
function is${declaration.name}(data: any): boolean {
    return ${getUnionClause(declaration.meaning)}
}
`
                }
                break;
            }
            case "interface": {
                result += `
function is${declaration.name}(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
    ${
    Object.entries(declaration.fields)
          .map(entry => {
              const [key, value] = entry;
              return getTypeValidateClause(key, value)
          }).join("\n")
    }
    return true;
}
        `
            }

        }
    }
    return result;
}

function make() {
    const declarations = extractDeclarations("../src/definitions/Actions.ts");
    const extendedDeclarations = InlineGenerics(declarations);
    const validatorSource = compile(extendedDeclarations);
    fs.writeFileSync("./validators.ts", validatorSource);
}

make();

