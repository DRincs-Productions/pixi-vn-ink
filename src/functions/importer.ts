import { importPixiVNJson, PixiVNJson } from "@drincs/pixi-vn-json";
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
 * @param text string or array of strings written in ink language
 * @returns 
 */
export async function importInkText(text: string | string[]): Promise<PixiVNJson[]> {
    let res: PixiVNJson[] = []
    // if is array
    if (Array.isArray(text)) {
        for (let t of text) {
            let labels = await importInkText(t)
            res.concat(labels)
        }
        return res
    }
    let data = convertInkText(text)
    if (data) {
        importPixiVNJson(data, {
            operationStringConvert: HashtagScriptManager.generateOrRunOperationFromHashtagScript,
            skipEmptyDialogs: true,
        })
        res.push(data)
    }
    return res
}
