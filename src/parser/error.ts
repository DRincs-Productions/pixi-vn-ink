import type { CompileSharedType, IssueType } from "@/parser/types";
import { ErrorType } from "inkjs/engine/Error";

export function getErrors(issues: IssueType[], recompile: () => void, shared: CompileSharedType) {
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
            const match = error.message.match(/Variable could not be found to assign to: (\w+)/);
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
                        ? Array.from({ length: requiredArgs }, (_, i) => `arg${i + 1}`).join(", ")
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
        return { issues };
    }
    return { issues };
}
