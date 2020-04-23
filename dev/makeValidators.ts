import * as fs from "fs";
import * as path from "path"
import * as ts from "typescript";

type PrimitiveType = {
    kind: "primitive",
    primitive: "string" | "number" | "boolean"
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

type Type = PrimitiveType | StringLiteralType | ArrayType | UnionType;

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
            return {
                kind: "reference",
                reference: {
                    identifier: node.getText(source)
                },
            };
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
    const keyvalues: InterfaceFields = {}
    rootNode.forEachChild(nextLevelNode => {
        const possibleKey = extractKey(nextLevelNode, source);
        if (possibleKey) {
            key = possibleKey;
        }
        const value = extractValueType(nextLevelNode, source);
        if (value) {
            keyvalues[key] = value;
        }
        else {
            return;
        }
    });
    return keyvalues;
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
                        let types: Type[] = [];
                        child.forEachChild(grandChild => {
                            types.push({
                                kind: "string-literal",
                                value: grandChild.getText(combinedSource),
                            });
                        });
                        meaning = {
                            kind: "union",
                            name,
                            types,
                        }
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

const literalValiator = `
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
`

function compile(declarations: Declaration[]): string {
    let result = `${literalValiator}${primitiveValidators}`;

    function getValidatorFnName(type: TypeLike): string {
        if (type.kind === "primitive") {
            return `is${type.primitive}`;
        }
        else if (type.kind === "reference") {
            return `is${type.reference.identifier}`;
        }
        else if (type.kind === "string-literal") {
            return `is(${type.value})`;
        }
        else if (type.kind === "array") {
            return `isArray(${getValidatorFnName(type.element)})`
        }
        else {
            return `is`
        }
    }

    for (const declaration of declarations) {
        switch (declaration.kind) {
            case "alias": {
                if (declaration.meaning.kind === "primitive") {
                    result += `const is${declaration.name} = is${declaration.meaning.primitive};`
                }
                else if (declaration.meaning.kind === "reference") {
                    result += `const is${declaration.name} = is${declaration.meaning.reference};`
                }
                else if (declaration.meaning.kind === "union") {
                    result += `
function is${declaration.name}(data: any): boolean {
  return ${declaration.meaning.types.map(type => {
                        switch (type.kind) {
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
                    }).join("\n||")};
}`
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
              return `
    if (!${getValidatorFnName(value)}(data.${key})) {
        return false;
    }
              `
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
    console.info(declarations)
    const validatorSource = compile(declarations);
    fs.writeFileSync("./validators.ts", validatorSource);
}

make();

