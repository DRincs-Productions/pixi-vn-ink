import type { PixiVNJson } from "@drincs/pixi-vn-json";
import { ErrorType } from "inkjs/compiler/Parser/ErrorType";
import { GLOBAL_DECL, SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES } from "../constant";
import InkStoryType from "../types/InkStoryType";
import { convertorInkToJson } from "./ink";
import { getInkLabels } from "./labels-converter";
import { logger } from "./log-utility";

/**
 * This function converts string written in ink language into the LabelJsonType.
 * @param text string or array of strings written in ink language
 * @returns LabelJsonType or undefined
 */
export function convertInkToJson(text: string): PixiVNJson | undefined {
    let result: PixiVNJson = {};
    let { json, labelToRemove, issues } = convertorInkToJson(text);
    issues.forEach(({ message, type }) => {
        if (type === ErrorType.Error) {
            logger.error("Ink compilation error: " + message);
        } else if (type === ErrorType.Warning) {
            logger.warn("Ink compilation warning: " + message);
        } else {
            logger.info("Ink compilation info: " + message);
        }
    });
    if (!json) {
        logger.error("No JSON generated from ink file");
        return;
    }
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
