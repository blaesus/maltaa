import * as fs from "fs";
import * as path from "path"
import * as ts from "typescript";

const exportList = [
    "MaltaaAction",
]

type PrimitiveType = {
    kind: "primitive",
    primitive: "string" | "number" | "boolean" | "null" | "undefined"
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

type OptionalType = {
    kind: "optional",
    value: TypeLike,
}

type Type = PrimitiveType | StringLiteralType | ArrayType | UnionType | GenericType | OptionalType;

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

function removeQuotations(s: string): string {
    return s.replace(/"/g, "").replace(/'/g, "");
}

function findAllImports(rootPath: string): string[] {

    let found = [rootPath];

    function findImports(source: ts.SourceFile): string[] {
        let imports: string[] = [];
        source.forEachChild(node => {
            if (node.kind === ts.SyntaxKind.ImportDeclaration) {
                node.forEachChild(child => {
                    if (child.kind === ts.SyntaxKind.StringLiteral) {
                        const pathReference = removeQuotations(child.getText(source));
                        const newPath = path.normalize(path.join(path.dirname(source.fileName), pathReference) + ".ts")
                        imports.push(newPath);
                    }
                })
            }
        })
        return imports;
    }

    function traverse(root: string) {
        const text = fs.readFileSync(root).toString();
        let source = ts.createSourceFile(root, text, ts.ScriptTarget.ES2019);
        const imports = findImports(source);
        for (const file of imports) {
            if (!found.includes(file)) {
                found.push(file);
                traverse(file);
            }
        }
    }

    traverse(rootPath);

    return found;
}

function preprocess(entryFileName: string): {entrySourceText: string, combinedSourceText: string} {
    const entry = path.resolve(entryFileName);
    let entryText = fs.readFileSync(entry).toString();

    const allImports = findAllImports(entry)

    let combinedText = allImports.map(path => fs.readFileSync(path).toString()).join("\n");
    return {
        entrySourceText: entryText,
        combinedSourceText: combinedText,
    }
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
        case ts.SyntaxKind.NullKeyword: {
            return {kind: "primitive", primitive: "null"};
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
        case ts.SyntaxKind.UnionType: {
            const union: UnionType = {
                kind: "union",
                name: "union",
                types: [],
            }
            node.forEachChild(child => {
                const value = extractValueType(child, source);
                if (value) {
                    union.types.push(value);
                }
            })
            return union;
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

function extractPropertySignatures(rootNode: ts.Node, source: ts.SourceFile): InterfaceFields {
    let key: string = "";
    let optional = false;
    const fields: InterfaceFields = {}
    rootNode.forEachChild(nextLevelNode => {
        const possibleKey = extractKey(nextLevelNode, source);
        if (possibleKey) {
            key = possibleKey;
        }
        if (nextLevelNode.kind === ts.SyntaxKind.QuestionToken) {
            optional = true;
        }
        const value = extractValueType(nextLevelNode, source);
        if (value) {
            if (optional) {
                fields[key] = {
                    kind: "optional",
                    value,
                };
            }
            else {
                fields[key] = value;
            }
        }
        else {
            return;
        }
    });
    return fields;
}

function extractUnion(node: ts.Node, source: ts.SourceFile, name: string): UnionType {
    let types: TypeLike[] = [];
    node.forEachChild(child => {
        const type = extractValueType(child, source);
        if (type) {
            types.push(type);
        }
    });
    return {
        kind: "union",
        name,
        types,
    }
}

function extractDeclarations(entryFileName: string): Declaration[] {
    const {entrySourceText, combinedSourceText} = preprocess(entryFileName);
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
                        const fields = extractPropertySignatures(secondLevelNode, combinedSource);
                        declaration.fields = {
                            ...declaration.fields,
                            ...fields
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

const preamble = `/* This file is automatically generated and updated. Please do not edit it manually. */\n`

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

function isnull(data: any): boolean {
    return data === null;
}

`

function extractGenericValueTypeToDeclaration(
    valueType: GenericType,
    allDeclarations: Declaration[]
): Declaration | null {
    const baseIdentifier = valueType.baseType.reference.identifier;
    switch (baseIdentifier) {
        case "Partial": {
            const firstParameter = valueType.parameters[0];
            if (firstParameter && firstParameter.kind === "reference") {
                const targetType = allDeclarations.find(d => d.name === firstParameter.reference.identifier)
                if (targetType && targetType.kind === "interface") {
                    const partialDeclaration: InterfaceDeclaration = {
                        kind: "interface",
                        name: "__Partial" + targetType.name,
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
                    return partialDeclaration;
                }
            }
            return null;
        }
        case "Pick": {
            const [firstParameter, secondParameter, _] = valueType.parameters;
            if (firstParameter && secondParameter && firstParameter.kind === "reference" && secondParameter.kind === "union") {
                const pickDeclaration: InterfaceDeclaration = {
                    kind: "interface",
                    name: "__Pick" + firstParameter.reference.identifier,
                    fields: {},
                };
                const target = allDeclarations.find(d => d.name === firstParameter.reference.identifier);
                if (target && target.kind === "interface") {
                    for (const entry of Object.entries(target.fields)) {
                        const [key, value] = entry;
                        if (secondParameter.types.some(t =>
                            t.kind === "string-literal" && removeQuotations(t.value) === key
                        )) {
                            pickDeclaration.fields[key] = value;
                        }
                    }
                }
                return pickDeclaration;
            }
            return null;
        }
        default: {
            console.warn("Generic not implemented", baseIdentifier);
            return null;
        }
    }
}

function InlineGenerics(declarations: Declaration[]): Declaration[] {
    const result = [];

    for (const declaration of declarations) {
        let passDirectly = true;
        if (declaration.kind === "interface") {
            for (const field of Object.entries(declaration.fields)) {
                const [key, value] = field;
                if (value.kind === "generic") {
                    const partialInterfaceDeclaration = extractGenericValueTypeToDeclaration(value, declarations);
                    if (partialInterfaceDeclaration) {
                        passDirectly = false;
                        result.push(partialInterfaceDeclaration);
                        const replacement: InterfaceDeclaration = JSON.parse(JSON.stringify(declaration));
                        replacement.fields[key] = {
                            kind: "reference",
                            reference: {
                                identifier: partialInterfaceDeclaration.name,
                            }
                        }
                        result.push(replacement);
                    }
                }
            }
        }
        else if (declaration.kind === "alias") {
            if (declaration.meaning.kind === "generic") {
                const value = declaration.meaning;
                const partialInterfaceDeclaration = extractGenericValueTypeToDeclaration(value, declarations);
                if (partialInterfaceDeclaration) {
                    passDirectly = false;
                    result.push(partialInterfaceDeclaration);
                    const replacement: TypeAliasDeclaration = JSON.parse(JSON.stringify(declaration));
                    replacement.meaning = {
                        kind: "reference",
                        reference: {
                            identifier: partialInterfaceDeclaration.name,
                        }
                    }
                    result.push(replacement);
                }
            }
        }
        if (passDirectly) {
            result.push(declaration);
        }
    }
    return result;

}

function compile(declarations: Declaration[]): string {
    let validatorCode = `${preamble}${literalValidator}${primitiveValidators}`;

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

    function getTypeCheckCondition(type: TypeLike, dataReference = "data"): string {
        if (type.kind === "primitive" || type.kind === "reference" || type.kind === "array") {
            return `${getValidatorFnName(type)}(${dataReference})`
        }
        else if (type.kind === "string-literal") {
            return `${dataReference} === ${type.value}`
        }
        else if (type.kind === "union") {
            const delimiter = type.types.length >= 4 ? "\n    ||" : " || "
            return type.types.map(condition => getTypeCheckCondition(condition, dataReference)).join(delimiter);
        }
        else if (type.kind === "optional") {
            return `isundefined(${dataReference}) || ${getTypeCheckCondition(type.value, dataReference)}`;
        }
        else {
            console.warn(`unimplemented_condition ${type.kind}`);
            return `true`;
        }
    }

    function getTypeValidateClause(key: string, type: TypeLike): string {
        return `
    if (!(${getTypeCheckCondition(type, `data.${key}`)})) {
        return false;
    }
        `
    }

    function getUnionClause(union: UnionType, dataReference = "data") {
        return getTypeCheckCondition(union, dataReference)
    }

    for (const declaration of declarations) {
        let declarationValidator: string = "";
        switch (declaration.kind) {
            case "alias": {
                if (declaration.meaning.kind === "primitive") {
                    declarationValidator = `\nconst is${declaration.name} = is${declaration.meaning.primitive};\n`
                }
                else if (declaration.meaning.kind === "reference") {
                    declarationValidator = `\nconst is${declaration.name} = is${declaration.meaning.reference.identifier};\n`
                }
                else if (declaration.meaning.kind === "union") {
                    declarationValidator = `
function is${declaration.name}(data: any): boolean {
    return ${getUnionClause(declaration.meaning)}
}
`
                }
                break;
            }
            case "interface": {
                declarationValidator = `
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

        if (exportList.includes(declaration.name)) {
            declarationValidator = `export ` + declarationValidator;
        }
        validatorCode += declarationValidator;
    }
    return validatorCode;
}

function make() {
    const declarations = extractDeclarations("../src/definitions/Actions.ts");
    const extendedDeclarations = InlineGenerics(declarations);
    console.info(JSON.stringify(extendedDeclarations.filter(d => d.name ==="LoadPodiumArticles"), null, 4));
    const validatorSource = compile(extendedDeclarations);
    fs.writeFileSync("../src/validators.ts", validatorSource);
}

make();
