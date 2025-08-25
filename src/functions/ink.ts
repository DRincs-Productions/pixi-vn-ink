import { Compiler } from "inkjs/compiler/Compiler";
import { ErrorType } from "inkjs/compiler/Parser/ErrorType";
import { logger } from "./log-utility";

export function convertorInkToJson(text: string, labelToRemove: string[] = []) {
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
        return { json, issues, labelToRemove };
    } catch (e) {
        const error = issues.find((em) => em.type === ErrorType.Error);
        if (error) {
            if (error.message.includes("Divert target not found")) {
                const match = error.message.match(/Divert target not found: '-> (\w+)'/);
                if (match && match[1]) {
                    const label = match[1];
                    const textToAdd = `\n\n=== ${label} ===\n\n-> DONE`;
                    text = text.concat(textToAdd);
                    return convertorInkToJson(text, [...labelToRemove, label]);
                }
            }
            throw new Error(error.message);
        }
        logger.error("Error compiling ink file");
        throw e;
    }
}
