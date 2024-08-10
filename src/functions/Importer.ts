import { importPixiVNJson } from "@drincs/pixi-vn";
import { convertInkText } from "./InkToPixivn";

/**
 * This function imports string or array of strings written in ink language into the Pixi’VN engine.
 * @example
 * ```ts
 * import { importInkText } from 'pixi-vn'
 * importInkText(`
 * === back_in_london ===
 * Hello, World!
 * `)
 * 
 * GameStepManager.callLabel("back_in_london", {})
 * ```
 * @param text string or array of strings written in ink language
 * @returns 
 */
export function importInkText(text: string | string[]) {
    // if is array
    if (Array.isArray(text)) {
        text.forEach((t) => {
            importInkText(t)
        })
        return
    }
    let data = convertInkText(text)
    if (data) {
        {
            importPixiVNJson(data)
        }
    }
}
