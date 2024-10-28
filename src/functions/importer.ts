import { importPixiVNJson, PixiVNJson } from "@drincs/pixi-vn-json";
import { getOperationFromCommand } from "../managers/CommandManager";
import { convertInkText } from "./ink-to-pixivn";

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
export function importInkText(text: string | string[]): PixiVNJson[] {
    let res: PixiVNJson[] = []
    // if is array
    if (Array.isArray(text)) {
        text.forEach((t) => {
            let labels = importInkText(t)
            res.concat(labels)
        })
        return res
    }
    let data = convertInkText(text)
    if (data) {
        importPixiVNJson(data, {
            operationStringConvert: getOperationFromCommand,
            skipEmptyDialogs: true,
        })
        res.push(data)
    }
    return res
}
