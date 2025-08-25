import type { PixiVNJson } from "@drincs/pixi-vn-json";
import { Compiler } from "inkjs/compiler/Compiler";
import { ErrorType } from "inkjs/engine/Error";
import { GLOBAL_DECL, SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES } from "../constant";
import InkStoryType from "../types/InkStoryType";
import { getInkLabels } from "./labels-converter";
import { logger } from "./log-utility";

/**
 * This function converts string written in ink language into the LabelJsonType.
 * @param text string or array of strings written in ink language
 * @returns LabelJsonType or undefined
 */
export function convertInkText(text: string): PixiVNJson | undefined {
    let result: PixiVNJson = {};
    let { json, labelToRemove } = convertorInkToJson(text);
    let obj: InkStoryType;
    try {
        obj = JSON.parse(json);
    } catch (e) {
        logger.error("Error parsing ink file");
        return;
    }

    result.labels = getInkLabels(obj.root);
    if (result.labels && GLOBAL_DECL in result.labels) {
        let global = result.labels[GLOBAL_DECL];
        delete result.labels[GLOBAL_DECL];
        global.forEach((item) => {
            if (item.operations) {
                result.initialOperations = result.initialOperations
                    ? [...result.initialOperations, ...item.operations]
                    : [...item.operations];
            }
        });
    }
    if (result.labels && SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES in result.labels) {
        let global = result.labels[SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES];
        delete result.labels[SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES];
        global.forEach((item) => {
            if (item.operations) {
                result.initialOperations = result.initialOperations
                    ? [...result.initialOperations, ...item.operations]
                    : [...item.operations];
            }
        });
    }

    labelToRemove.forEach((label) => {
        if (result.labels && label in result.labels) {
            delete result.labels[label];
        }
    });

    return result;
}

function convertorInkToJson(text: string, labelToRemove: string[] = []) {
    const errorMessages: { message: string; type: ErrorType }[] = [];
    try {
        const compiler = new Compiler(text, {
            errorHandler: (message: string, type: ErrorType) => {
                if (type === ErrorType.Error) {
                    logger.error("Ink compilation error: " + message);
                } else if (type === ErrorType.Warning) {
                    logger.warn("Ink compilation warning: " + message);
                } else {
                    logger.info("Ink compilation info: " + message);
                }
                errorMessages.push({ message, type });
            },
            countAllVisits: true,
            fileHandler: null,
            pluginNames: [],
            sourceFilename: null,
        });
        const story = compiler.Compile();
        let json = story.ToJson() || "";
        return { json, errorMessages, labelToRemove };
    } catch (e) {
        const error = errorMessages.find((em) => em.type === ErrorType.Error);
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
