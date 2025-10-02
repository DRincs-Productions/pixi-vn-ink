import { Compiler } from "inkjs/compiler/Compiler";
import { ErrorType } from "inkjs/compiler/Parser/ErrorType";
import { logger } from "./log-utility";

export function convertorInkToJson(text: string, labelToRemove: string[] = [], initialVarsToRemove: string[] = []) {
    const issues: { message: string; type: ErrorType }[] = [];
    try {
        const compiler = new Compiler(text, {
            errorHandler: (message: string, type: ErrorType) => {
                issues.push({ message, type });
            },
            countAllVisits: true,
            fileHandler: null,
            pluginNames: [],
            sourceFilename: null,
        });
        const story = compiler.Compile();
        let json = story.ToJson() || "";
        return { json, issues, labelToRemove, initialVarsToRemove };
    } catch (e) {
        const error = issues.find((em) => em.type === ErrorType.Error);
        if (error) {
            if (error.message.includes("Divert target not found")) {
                const match = error.message.match(/Divert target not found: '-> (\w+)'/);
                if (match && match[1]) {
                    const label = match[1];
                    const textToAdd = `\n\n=== ${label} ===\n\n-> DONE`;
                    text = text.concat(textToAdd);
                    return convertorInkToJson(text, [...labelToRemove, label], initialVarsToRemove);
                }
            }
            if (error.message.includes("Unresolved variable")) {
                const match = error.message.match(/Unresolved variable: (\w+)/);
                if (match && match[1]) {
                    const varName = match[1];
                    const textToAdd = `VAR ${varName} = ""\n\n`;
                    text = textToAdd.concat(text);
                    return convertorInkToJson(text, labelToRemove, [...initialVarsToRemove, varName]);
                }
            }
            if (error.message.includes("Variable could not be found to assign to")) {
                const match = error.message.match(/Variable could not be found to assign to: (\w+)/);
                if (match && match[1]) {
                    const varName = match[1];
                    const textToAdd = `VAR ${varName} = ""\n\n`;
                    text = textToAdd.concat(text);
                    return convertorInkToJson(text, labelToRemove, [...initialVarsToRemove, varName]);
                }
            }
            return { issues, labelToRemove, initialVarsToRemove };
        }
        logger.error("Error compiling ink file");
        throw e;
    }
}
