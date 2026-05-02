import { logger } from "@/utils/log-utility";
import { Compiler } from "inkjs/compiler/Compiler";
import { ErrorType } from "inkjs/compiler/Parser/ErrorType";

export function convertorInkToJson(
    text: string,
    labelToRemove: string[] = [],
    initialVarsToRemove: string[] = [],
    functions: { name: string; args: number }[] = [],
) {
    const issues: { message: string; type: ErrorType }[] = [];
    try {
        const compiler = new Compiler(text, {
            errorHandler: (message: string, type: ErrorType) => {
                issues.push({ message, type });
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
        return { json, issues, labelToRemove, initialVarsToRemove, functions };
    } catch (e) {
        const error = issues.find((em) => em.type === ErrorType.Error);
        if (error) {
            if (error.message.includes("Divert target not found")) {
                const match = error.message.match(/Divert target not found: '-> (\w+)'/);
                if (match?.[1]) {
                    const labelName = match[1];
                    const textToAdd = `\n\n=== ${labelName} ===\n\n-> DONE`;
                    text = text.concat(textToAdd);
                    labelToRemove.push(labelName);
                    return convertorInkToJson(text, labelToRemove, initialVarsToRemove, functions);
                }
            }
            if (error.message.includes("Unresolved variable")) {
                const match = error.message.match(/Unresolved variable: (\w+)/);
                if (match?.[1]) {
                    const varName = match[1];
                    const textToAdd = `VAR ${varName} = ""\n\n`;
                    text = textToAdd.concat(text);
                    initialVarsToRemove.push(varName);
                    return convertorInkToJson(text, labelToRemove, initialVarsToRemove, functions);
                }
            }
            if (error.message.includes("Variable could not be found to assign to")) {
                const match = error.message.match(
                    /Variable could not be found to assign to: (\w+)/,
                );
                if (match?.[1]) {
                    const varName = match[1];
                    const textToAdd = `VAR ${varName} = ""\n\n`;
                    text = textToAdd.concat(text);
                    initialVarsToRemove.push(varName);
                    return convertorInkToJson(text, labelToRemove, initialVarsToRemove, functions);
                }
            }
            if (error.message.includes("Function call target not found")) {
                const match = error.message.match(/Function call target not found: '-> (\w+)'/);
                if (match?.[1]) {
                    const functionName = match[1];
                    const textToAdd = `\n\n=== function ${functionName}() ===\n\n~ return\n\n`;
                    text = text.concat(textToAdd);
                    functions.push({ name: functionName, args: 0 });
                    labelToRemove.push(functionName);
                    return convertorInkToJson(text, labelToRemove, initialVarsToRemove, functions);
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
                    text = text.replaceAll(
                        `\n\n=== function ${functionName}() ===\n\n~ return\n\n`,
                        "",
                    ); // Remove previous placeholder if exists
                    text = text.concat(textToAdd);
                    const fun = functions.find((f) => f.name === functionName);
                    if (fun) {
                        fun.args = requiredArgs;
                    } else {
                        functions.push({ name: functionName, args: requiredArgs });
                        labelToRemove.push(functionName);
                    }
                    return convertorInkToJson(text, labelToRemove, initialVarsToRemove, functions);
                }
            }
            return { issues, labelToRemove, initialVarsToRemove, functions };
        }
        logger.error("Error compiling ink file");
        throw e;
    }
}
