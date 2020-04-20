import * as fs from "fs";
import * as path from "path"
import * as ts from "typescript";

type PrimitiveDefinition = "string" | "number";

type ReferenceDefinition = {
    name: string,
}

type ValueDefinition = PrimitiveDefinition | ReferenceDefinition;

interface InterfaceDefinition {
    name: string,
    keyvalues: {
        [key in string]: ValueDefinition
    }
}

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
                    console.info("ADD", newText.length)
                    combinedSourceText = `${newText}\n${combinedSourceText}`;
                }
            })
        }
    })
    return {entrySourceText, combinedSourceText};
}

function extractDefinitions(entryFileName: string): InterfaceDefinition[] {
    const {entrySourceText, combinedSourceText} = prepropcess(entryFileName);
    const source = ts.createSourceFile("test.ts", entrySourceText, ts.ScriptTarget.ES2019)
    const combinedSource = ts.createSourceFile("combined.ts", combinedSourceText, ts.ScriptTarget.ES2019)
    const definitions: InterfaceDefinition[] = [];
    combinedSource.forEachChild(node => {
        if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
            const definition: InterfaceDefinition = {name: "", keyvalues: {}};
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
                                definition.keyvalues[key] = "string";
                                break;
                            }
                            case ts.SyntaxKind.NumberKeyword: {
                                definition.keyvalues[key] = "number";
                                break;
                            }
                            case ts.SyntaxKind.TypeReference: {
                                definition.keyvalues[key] = {
                                    name: grandchild.getText(combinedSource)
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
    });
    return definitions;
}

const primitiveValidators = `
export function isstring(data: any): boolean {
    return typeof data === "string";
}
export function isnumber(data: any): boolean {
    return typeof data === "number";
}
`

function compile(definitions: InterfaceDefinition[]): string {
    let result = primitiveValidators;

    function getValidatorFnName(value: ValueDefinition): string {
        if (typeof value === "string") {
            return `is${value}`;
        }
        else if (value.name) {
            return `is${value.name}`
        }
        else {
            return 'is'
        }
    }

    for (const definition of definitions) {
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
    return result;
}

async function make() {
    const definitions = extractDefinitions("../src/definitions/Actions.ts");
    const validators = compile(definitions);
    fs.writeFileSync("./validators.ts", validators);
}

make();

