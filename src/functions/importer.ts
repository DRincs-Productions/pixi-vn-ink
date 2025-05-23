import { importPixiVNJson } from "@drincs/pixi-vn-json";
import HashtagScriptManager from "../managers/HashtagScriptManager";
import { convertInkText } from "./ink-to-pixivn";

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
export async function importInkText(texts: string | string[]): Promise<void[]> {
    if (!Array.isArray(texts)) {
        texts = [texts];
    }
    const promises = texts.map(async (text) => {
        let data = convertInkText(text);
        if (data) {
            await importPixiVNJson(data, {
                operationStringConvert: HashtagScriptManager.generateOrRunOperationFromHashtagScript,
                skipEmptyDialogs: true,
            });
        }
    });
    return await Promise.all(promises);
}
