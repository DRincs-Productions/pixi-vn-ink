import type InkStoryType from "@/interfaces/InkStoryType";
import { logger } from "@/utils/log-utility";
import { InkMapper } from "@drincs/pixi-vn-ink/mapper";
import { InkCompiler } from "@drincs/pixi-vn-ink/parser";
import type { PixiVNJson } from "@drincs/pixi-vn-json";
import { ErrorType } from "inkjs/compiler/Parser/ErrorType";
import JSON5 from "json5";

/**
 * This function converts string written in ink language into the LabelJsonType.
 * @param text string or array of strings written in ink language
 * @returns LabelJsonType or undefined
 */
export function convertInkToJson(text: string): PixiVNJson | undefined {
    const shared = {
        labelToRemove: [],
        initialVarsToRemove: [],
        functions: [],
        enums: {},
    };
    const { json, issues } = InkCompiler.compile(text, shared);
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
    } catch (_e) {
        logger.error("Error parsing ink file");
        return;
    }
    shared.enums = obj.listDefs || {};
    return InkMapper.inkToJson(obj, shared);
}
