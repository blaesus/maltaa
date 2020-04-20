import * as fs from "fs";
import * as path from "path"
import * as ts from "typescript";

type PrimitiveDefinition = {
    kind: "primitive",
    primitive: "string" | "number"
};

type StringLiteralDefinition = {
    kind: "literal",
    literal: string,
}

type ReferenceDefinition = {
    kind: "reference",
    reference: string,
}

type ValueDefinition = PrimitiveDefinition | ReferenceDefinition | StringLiteralDefinition;

interface InterfaceDefinition {
    kind: "interface",
    name: string,
    keyvalues: {
        [key in string]: ValueDefinition
    }
}

interface UnionTypeDefinition {
    kind: "union",
    name: string,
    conditions: ValueDefinition[],
}

interface AliasTypeDefinition {
    kind: "alias",
    name: string,
    value: ValueDefinition;
}


type TypeDefinition = UnionTypeDefinition | InterfaceDefinition | AliasTypeDefinition;

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

function extractDefinitions(entryFileName: string): TypeDefinition[] {
    const {entrySourceText, combinedSourceText} = prepropcess(entryFileName);
    const source = ts.createSourceFile("test.ts", entrySourceText, ts.ScriptTarget.ES2019)
    const combinedSource = ts.createSourceFile("combined.ts", combinedSourceText, ts.ScriptTarget.ES2019)
    const definitions: TypeDefinition[] = [];
    combinedSource.forEachChild(node => {
        if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
            const definition: TypeDefinition = {kind: "interface", name: "", keyvalues: {}};
            node.forEachChild(child => {
                if (child.kind === ts.SyntaxKind.Identifier) {
                    definition.name = child.getText(combinedSource);
                }
                else if (child.kind === ts.SyntaxKind.PropertySignature) {
                    let key: string = "";
                    child.forEachChild(grandchild => {
                        switch (grandchild.kind) {
                            case ts.SyntaxKind.Identifier: {
                                key = (grandchild as any)["escapedText"];
                                break;
                            }
                            case ts.SyntaxKind.StringKeyword: {
                                definition.keyvalues[key] = {kind: "primitive", primitive: "string"};
                                break;
                            }
                            case ts.SyntaxKind.NumberKeyword: {
                                definition.keyvalues[key] = {kind: "primitive", primitive: "number"};
                                break;
                            }
                            case ts.SyntaxKind.TypeReference: {
                                definition.keyvalues[key] = {
                                    kind: "reference",
                                    reference: grandchild.getText(combinedSource)
                                };
                                break;
                            }
                            default: {}
                        }
                    })
                }
            })
            definitions.push(definition);
        }
        else if (node.kind === ts.SyntaxKind.TypeAliasDeclaration) {
            let name: string = "";
            let conditions: ValueDefinition[] = [];
            let value: ValueDefinition | null = null;
            node.forEachChild(child => {
                if (child.kind === ts.SyntaxKind.Identifier) {
                    name = child.getText(combinedSource);
                }
                else if (child.kind === ts.SyntaxKind.UnionType) {
                    child.forEachChild(grandChild => {
                        conditions.push({
                            kind: "literal",
                            literal: grandChild.getFullText(combinedSource)
                        })
                    })
                }
                else if (child.kind === ts.SyntaxKind.StringKeyword) {
                    value = {
                        kind: "primitive",
                        primitive: "string",
                    }
                }
            })
            if (value) {
                definitions.push({
                    kind: "alias",
                    name,
                    value: value,
                })
            } else {
                definitions.push({
                    kind: "union",
                    name,
                    conditions,
                });
            }

        }
    });
    return definitions;
}

const literalValiator = `
function is(valueA: any): any {
  return function(valueB: any): boolean {
    return valueB === valueA;
  }
}
`

const primitiveValidators = `
export function isstring(data: any): boolean {
    return typeof data === "string";
}
export function isnumber(data: any): boolean {
    return typeof data === "number";
}
`

function compile(definitions: TypeDefinition[]): string {
    let result = `${literalValiator}${primitiveValidators}`;

    function getValidatorFnName(value: ValueDefinition): string {
        if (value.kind === "primitive") {
            return `is${value.primitive}`;
        }
        else if (value.kind === "reference") {
            return `is${value.reference}`;
        }
        else if (value.kind === "literal") {
            return `is(${value.literal})`;
        }
        else {
            return `is`
        }
    }

    for (const definition of definitions) {
        switch (definition.kind) {
            case "union": {
                result += `
export function is${definition.name}(data: any): boolean {
  return true;
}
        `
                break;
            }
            case "interface": {
                result += `
export function is${definition.name}(data: any): boolean {
  ${
                    Object.entries(definition.keyvalues)
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

async function make() {
    const definitions = extractDefinitions("../src/definitions/Actions.ts");
    const validators = compile(definitions);
    fs.writeFileSync("./validators.ts", validators);
}

make();

