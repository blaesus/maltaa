import * as fs from "fs";
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

function extractDefinitions(code: string): InterfaceDefinition[] {
    const source = ts.createSourceFile("test.ts", code, ts.ScriptTarget.ES2019)
    const definitions: InterfaceDefinition[] = [];
    source.forEachChild(node => {
        if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
            const definition: InterfaceDefinition = {name: "", keyvalues: {}};
            node.forEachChild(child => {
                if (child.kind === ts.SyntaxKind.Identifier) {
                    definition.name = child.getText(source);
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
                                    name: grandchild.getText(source)
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
function isstring(data: any): boolean {
    return typeof data === "string";
}
function isnumber(data: any): boolean {
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
function is${definition.name}(data: any): boolean {
  ${
    Object.entries(definition.keyvalues)
          .map(entry => {
              const [key, value] = entry;
              return `
              if (!${getValidatorFnName(value)}(data.${key})) {
                return false;
              }
              `
          })
  }
  return true;
}
        `
    }
    return result;
}

async function make() {
    const content = fs.readFileSync("../src/definitions/Actions.ts").toString();
    const definitions = extractDefinitions(content);
    console.info(compile(definitions));
}

make();

