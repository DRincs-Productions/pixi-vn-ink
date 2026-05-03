import type { CompileSharedType, IssueType } from "@/parser/types";
import { Compiler } from "inkjs/compiler/Compiler";
import { ErrorType } from "inkjs/compiler/Parser/ErrorType";

export namespace InkCompiler {
    export function compile(
        text: string,
        shared: Omit<CompileSharedType, "textSource"> = {
            labelToRemove: [],
            initialVarsToRemove: [],
            functions: [],
        },
    ) {
        const issues: IssueType[] = [];
        try {
            const compiler = new Compiler(text, {
                errorHandler: (message: string, type: ErrorType) => {
                    const cleanedMsg = message.replace(/^[A-Z]+: line \d+: ?/, "");
                    const lineMatch = message.match(/line (\d+)/);
                    issues.push({
                        message: cleanedMsg,
                        type,
                        line: lineMatch ? Number(lineMatch[1]) : -1,
                    });
                },
                countAllVisits: true,
                fileHandler: {
                    ResolveInkFilename: (filename: string) => filename,
                    LoadInkFileContents: () => {
                        return "";
                    },
                },
                pluginNames: [],
                sourceFilename: null,
            });
            const story = compiler.Compile();
            const json = story.ToJson() || "";
            return { json, issues };
        } catch (_e) {
            let recompile = false;
            const sharedWithText = { ...shared, textSource: text };
            getErrors(
                issues,
                () => {
                    recompile = true;
                },
                sharedWithText,
            );
            if (recompile) {
                return compile(sharedWithText.textSource, shared);
            }
            return { issues };
        }
    }

    export function getErrors(
        issues: IssueType[],
        recompile: () => void,
        shared: CompileSharedType,
    ) {
        const { functions, initialVarsToRemove, labelToRemove } = shared;
        const error = issues.find((em) => em.type === ErrorType.Error);
        if (error) {
            if (error.message.includes("Divert target not found")) {
                const match = error.message.match(/Divert target not found: '-> (\w+)'/);
                if (match?.[1]) {
                    const labelName = match[1];
                    const textToAdd = `\n\n=== ${labelName} ===\n\n-> DONE`;
                    shared.textSource = shared.textSource.concat(textToAdd);
                    labelToRemove.push(labelName);
                    return recompile();
                }
            }
            if (error.message.includes("Unresolved variable")) {
                const match = error.message.match(/Unresolved variable: (\w+)/);
                if (match?.[1]) {
                    const varName = match[1];
                    const textToAdd = `VAR ${varName} = ""\n\n`;
                    shared.textSource = textToAdd.concat(shared.textSource);
                    initialVarsToRemove.push(varName);
                    return recompile();
                }
            }
            if (error.message.includes("Variable could not be found to assign to")) {
                const match = error.message.match(
                    /Variable could not be found to assign to: (\w+)/,
                );
                if (match?.[1]) {
                    const varName = match[1];
                    const textToAdd = `VAR ${varName} = ""\n\n`;
                    shared.textSource = textToAdd.concat(shared.textSource);
                    initialVarsToRemove.push(varName);
                    return recompile();
                }
            }
            if (error.message.includes("Function call target not found")) {
                const match = error.message.match(/Function call target not found: '-> (\w+)'/);
                if (match?.[1]) {
                    const functionName = match[1];
                    const textToAdd = `\n\n=== function ${functionName}() ===\n\n~ return\n\n`;
                    shared.textSource = shared.textSource.concat(textToAdd);
                    functions.push({ name: functionName, args: 0 });
                    labelToRemove.push(functionName);
                    return recompile();
                }
            }
            if (error.message.includes(" arguments, but got ")) {
                // Example: Function call to 'random_event_value' requires 0 arguments, but got 2
                const match = error.message.match(
                    /Function call to '(\w+)' requires (\d+) arguments, but got (\d+)/,
                );
                if (match?.[1]) {
                    const functionName = match[1];
                    const requiredArgs = parseInt(match[3] || "0", 10);
                    // Build a placeholder argument list: arg1, arg2, ...
                    const argsList =
                        requiredArgs > 0
                            ? Array.from({ length: requiredArgs }, (_, i) => `arg${i + 1}`).join(
                                  ", ",
                              )
                            : "";
                    const textToAdd = `\n\n=== function ${functionName}(${argsList}) ===\n\n~ return\n\n`;
                    shared.textSource = shared.textSource.replaceAll(
                        `\n\n=== function ${functionName}() ===\n\n~ return\n\n`,
                        "",
                    ); // Remove previous placeholder if exists
                    shared.textSource = shared.textSource.concat(textToAdd);
                    const fun = functions.find((f) => f.name === functionName);
                    if (fun) {
                        fun.args = requiredArgs;
                    } else {
                        functions.push({ name: functionName, args: requiredArgs });
                        labelToRemove.push(functionName);
                    }
                    return recompile();
                }
            }

            issues.forEach((issue) => {
                // Function call to 'test' requires 1 arguments, but got 3
                const match = issue.message.match(
                    /Function call to '(\w+)' requires (\d+) arguments, but got (\d+)/,
                );
                if (match?.[1]) {
                    issue.message = `The function '${match[1]}' have optional arguments, but in ink all arguments must be required. Please make sure to provide all the required arguments for the function call.`;
                }
            });
            return { issues };
        }
        return { issues };
    }
}
