export { onInkHashtagScript } from "./hashtag-script";
export { convertInkText } from "./ink-to-pixivn";
export { onReplaceTextAfterTranslation, onReplaceTextBeforeTranslation } from "./replace";
export { generateJsonInkTranslation, onInkTranslate } from "./translate";
import { init } from "@drincs/pixi-vn-json";
import { importInkText as importInkTextTemp } from "./importer";

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
export function importInkText(texts: string | string[]): Promise<void[]> {
    init();
    return importInkTextTemp(texts);
}
