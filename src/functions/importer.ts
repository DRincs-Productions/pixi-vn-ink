import { init, PixiVNJson } from "@drincs/pixi-vn-json";
import { importPixiVNJson } from "@drincs/pixi-vn-json/importer";
import HashtagCommands from "../tags/hashtag-commands";
import { convertInkToJson } from "./ink-to-pixivn";

/**
 * This function imports string or array of strings written in ink language into the Pixi’VN engine.
 * @example
 * ```ts
 * import { importInkText } from 'pixi-vn'
 * importInkText(`
 * === back_in_london ===
 * Hello, World!
 * `).then(() => {
 *     GameStepManager.callLabel("back_in_london", {})
 * })
 * ```
 * @param texts string or array of strings written in ink language
 * @returns
 */
export async function importInkText(texts: string | string[]): Promise<string[]> {
    if (!Array.isArray(texts)) {
        texts = [texts];
    }
    init();
    const promises = texts.map(async (text) => {
        let data = convertInkToJson(text);
        if (data) {
            await importPixiVNJson(data, {
                operationStringConvert: HashtagCommands.run,
                skipEmptyDialogs: true,
            });
        }
        return text;
    });
    return await Promise.all(promises);
}

/**
 * This function imports data in PixiVNJson format into the Pixi’VN engine.
 * @param data data in PixiVNJson format
 * @returns the same data passed as parameter
 */
export async function importJson(data: PixiVNJson | PixiVNJson[]) {
    init();
    return await importPixiVNJson(data, {
        operationStringConvert: HashtagCommands.run,
        skipEmptyDialogs: true,
    });
}
