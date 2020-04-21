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

type ArrayModifier = {
    kind: "array",
    element: ValueDefinition,
}

type ValueDefinition =
    PrimitiveDefinition
    | ReferenceDefinition
    | StringLiteralDefinition
    | ArrayModifier
;

type InterfaceData = {
    [key in string]: ValueDefinition
}

interface InterfaceDefinition {
    kind: "interface",
    name: string,
    keyvalues: InterfaceData
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

function extractPropertySignatureValue(
    node: ts.Node, source: ts.SourceFile
): string | ValueDefinition | null {
    switch (node.kind) {
        case ts.SyntaxKind.Identifier: {
            return node.getText(source);
        }
        case ts.SyntaxKind.StringKeyword: {
            return {kind: "primitive", primitive: "string"};
        }
        case ts.SyntaxKind.NumberKeyword: {
            return {kind: "primitive", primitive: "number"};
        }
        case ts.SyntaxKind.TypeReference: {
            return {
                kind: "reference",
                reference: node.getText(source),
            };
        }
        case ts.SyntaxKind.LiteralType: {
            return {
                kind: "literal",
                literal: node.getText(source),
            };
        }
        case ts.SyntaxKind.ArrayType: {
            let grandChild
            node.forEachChild(candidate => {
                grandChild = candidate;
            })
            if (grandChild) {
                const value = extractPropertySignatureValue(grandChild, source);
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

function extractPropertySignature(rootNode: ts.Node, source: ts.SourceFile): InterfaceData {
    let key: string = "";
    const keyvalues: InterfaceData = {}
    rootNode.forEachChild(nextLevelNode => {
        const value = extractPropertySignatureValue(nextLevelNode, source);
        if (typeof value === "string") {
            key = value;
        }
        else if (value) {
            keyvalues[key] = value;
        }
        else {
            return;
        }
    });
    return keyvalues;
}

function extractDefinitions(entryFileName: string): TypeDefinition[] {
    const {entrySourceText, combinedSourceText} = prepropcess(entryFileName);
    const source = ts.createSourceFile("test.ts", entrySourceText, ts.ScriptTarget.ES2019)
    const combinedSource = ts.createSourceFile("combined.ts", combinedSourceText, ts.ScriptTarget.ES2019)
    const definitions: TypeDefinition[] = [];
    combinedSource.forEachChild(firstLevelNode => {
        switch (firstLevelNode.kind) {
            case ts.SyntaxKind.InterfaceDeclaration: {
                const definition: TypeDefinition = {kind: "interface", name: "", keyvalues: {}};
                firstLevelNode.forEachChild(secondLevelNode => {
                    if (secondLevelNode.kind === ts.SyntaxKind.Identifier) {
                        definition.name = secondLevelNode.getText(combinedSource);
                    }
                    else if (secondLevelNode.kind === ts.SyntaxKind.PropertySignature) {
                        const keyvalues = extractPropertySignature(secondLevelNode, combinedSource);
                        definition.keyvalues = {
                            ...definition.keyvalues,
                            ...keyvalues
                        };
                        console.info(definition)
                    }
                });
                definitions.push(definition);
                break;
            }
            case ts.SyntaxKind.TypeAliasDeclaration: {
                let name: string = "";
                let conditions: ValueDefinition[] = [];
                let value: ValueDefinition | null = null;
                firstLevelNode.forEachChild(child => {
                    if (child.kind === ts.SyntaxKind.Identifier) {
                        name = child.getText(combinedSource);
                    }
                    else if (child.kind === ts.SyntaxKind.UnionType) {
                        child.forEachChild(grandChild => {
                            conditions.push({
                                kind: "literal",
                                literal: grandChild.getText(combinedSource),
                            });
                        });
                    }
                    else if (child.kind === ts.SyntaxKind.StringKeyword) {
                        value = {
                            kind: "primitive",
                            primitive: "string",
                        };
                    }
                    else if (child.kind === ts.SyntaxKind.TypeReference) {
                        value = {
                            kind: "reference",
                            reference: child.getText(combinedSource),
                        };
                    }
                });
                if (value) {
                    definitions.push({
                        kind: "alias",
                        name,
                        value: value,
                    });
                }
                else if (conditions.length) {
                    definitions.push({
                        kind: "union",
                        name,
                        conditions,
                    });
                }
                break;

            }
        }
    });
    return definitions;
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
        else if (value.kind === "array") {
            return `isArray(${getValidatorFnName(value.element)})`
        }
        else {
            return `is`
        }
    }

    for (const definition of definitions) {
        switch (definition.kind) {
            case "union": {
                result += `
function is${definition.name}(data: any): boolean {
  return ${definition.conditions.map(value => {
      switch (value.kind) {
          case "literal": {
              if (value.literal.startsWith(`"`)) {
                  return `is(${value.literal})(data)`
              }
              else {
                  return `is${value.literal}(data)`
              }
          }
          default: {
              return true;
          }
      }
                }).join("||")};
}
        `
                break;
            }
            case "alias": {
                if (definition.value.kind === "primitive") {
                    result += `const is${definition.name} = is${definition.value.primitive};`
                }
                else if (definition.value.kind === "reference") {
                    result += `const is${definition.name} = is${definition.value.reference};`
                }
                break;
            }
            case "interface": {
                result += `
function is${definition.name}(data: any): boolean {
  if (typeof data !== "object") {
      return false;
  }
  if (!data) {
      return false;
  }
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

function make() {
    const definitions = extractDefinitions("../src/definitions/Actions.ts");
    const validators = compile(definitions);
    fs.writeFileSync("./validators.ts", validators);
}

make();

