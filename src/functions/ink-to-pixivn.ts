import { GLOBAL_DECL, SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES } from "@/constant";
import { convertorInkToJson } from "@/functions/ink";
import { getInkLabels } from "@/functions/labels-converter";
import type InkStoryType from "@/interfaces/InkStoryType";
import { logger } from "@/utils/log-utility";
import type { PixiVNJson } from "@drincs/pixi-vn-json";
import { ErrorType } from "inkjs/compiler/Parser/ErrorType";
import JSON5 from "json5";

/**
 * This function converts string written in ink language into the LabelJsonType.
 * @param text string or array of strings written in ink language
 * @returns LabelJsonType or undefined
 */
export function convertInkToJson(text: string): PixiVNJson | undefined {
    const { json, labelToRemove, issues, initialVarsToRemove, functions } =
        convertorInkToJson(text);
    issues.forEach(({ message, type }) => {
        if (type === ErrorType.Error) {
            logger.error(`Ink compilation error: ${message}`);
        } else if (type === ErrorType.Warning) {
            logger.warn(`Ink compilation warning: ${message}`);
        } else {
            logger.info(`Ink compilation info: ${message}`);
        }
    });
    if (!json) {
        logger.error("No JSON generated from ink file");
        return;
    }
    let obj: InkStoryType;
    try {
        obj = JSON5.parse(json);
    } catch (e) {
        logger.error("Error parsing ink file");
        return;
    }
    return convertInkStoryToJson(obj, { labelToRemove, initialVarsToRemove, functions });
}

export function convertInkStoryToJson(
    obj: InkStoryType,
    options: {
        labelToRemove?: string[];
        initialVarsToRemove?: string[];
        functions?: { name: string; args: number }[];
    } = {},
): PixiVNJson | undefined {
    const { labelToRemove = [], initialVarsToRemove = [] } = options;
    const result: PixiVNJson = {};
    result.labels = getInkLabels(obj.root, options);
    if (result.labels && GLOBAL_DECL in result.labels) {
        const global = result.labels[GLOBAL_DECL];
        delete result.labels[GLOBAL_DECL];
        global.forEach((item) => {
            if (item.operations) {
                result.initialOperations = result.initialOperations
                    ? [...result.initialOperations, ...(item.operations as any)]
                    : [...item.operations];
            }
        });
    }
    if (result.labels && SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES in result.labels) {
        const global = result.labels[SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES];
        delete result.labels[SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES];
        global.forEach((item) => {
            if (item.operations) {
                result.initialOperations = result.initialOperations
                    ? [...result.initialOperations, ...(item.operations as any)]
                    : [...item.operations];
            }
        });
    }

    labelToRemove.forEach((label) => {
        if (result.labels && label in result.labels) {
            delete result.labels[label];
        }
    });
    initialVarsToRemove.forEach((v) => {
        if (result.initialOperations) {
            result.initialOperations = result.initialOperations.filter((op) => {
                if (op.type === "value") {
                    if (op.key === v) {
                        return false;
                    }
                }
                return true;
            });
        }
    });

    return result;
}
