import type InkStoryType from "@/interfaces/InkStoryType";
import type { CharacterIdSource, LoaderSharedType } from "@/loader/type";
import { InkMapper } from "@/mapper";
import { InkCompiler } from "@/parser";
import type { CompileSharedType } from "@/parser/types";
import { logger } from "@/utils/log-utility";
import type { PixiVNJson } from "@drincs/pixi-vn-json/schema";
import { ErrorType } from "inkjs/compiler/Parser/ErrorType";
import JSON5 from "json5";

/** Normalises character sources (ids or `{ id }` objects) into a set of ids, or `undefined` if empty. */
export function normalizeCharacterIds(
    characters?: readonly CharacterIdSource[],
): ReadonlySet<string> | undefined {
    if (!characters || characters.length === 0) {
        return undefined;
    }
    const ids = new Set<string>();
    for (const character of characters) {
        const id = typeof character === "string" ? character : character?.id;
        if (typeof id === "string" && id.length > 0) {
            ids.add(id);
        }
    }
    return ids.size > 0 ? ids : undefined;
}

/**
 * This function converts string written in ink language into the LabelJsonType.
 * @param text string or array of strings written in ink language
 * @returns LabelJsonType or undefined
 */
export function convertInkToJson(
    text: string,
    options: Partial<LoaderSharedType> = {},
): PixiVNJson | undefined {
    const shared: CompileSharedType = {
        labelToRemove: [],
        initialVarsToRemove: [],
        functions: options.functions || [],
        enums: options.enums || {},
        textSource: text,
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
    return InkMapper.inkToJson(obj, {
        ...shared,
        characterIds: normalizeCharacterIds(options.characters),
    });
}
