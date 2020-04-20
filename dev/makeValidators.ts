import * as ts from "typescript";

function compile(code: string): void {
    const source = ts.createSourceFile("test.ts", code, ts.ScriptTarget.ES2019)
    console.info(source.getChildren())
}

compile("function() {}")

