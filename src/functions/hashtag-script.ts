import type { StepLabelPropsType } from "@drincs/pixi-vn";
import HashtagScript from "../managers/HashtagScript";

/**
 * This function is called before the system interprets a possible Hashtag-Script that starts with `#`.
 * The developer can use this function to run a custom Hashtag-Script. If the function returns `true`, the system will not interpret the Hashtag-Script.
 * If returns a array of strings, the system will interpret the array as a new Hashtag-Script.
 * @param runCustomHashtagScript The function to run a custom Hashtag-Script
 * @example
 * ```ts
 * import { onInkHashtagScript } from 'pixi-vn-ink'
 *
 * onInkHashtagScript((script, convertListStringToObj) => {
 *    // script: # navigate scene_name prop1 "value 1" prop2 "value 2"
 *    if (script[0] === "navigate" && script.length > 1) {
 *        let prop = undefined
 *        if (script.length > 2) {
 *            prop = convertListStringToObj(script.slice(2))
 *        }
 *        navigateTo(script[1], prop)
 *        return true
 *    }
 *    return false
 * })
 * ```
 */
export function onInkHashtagScript(
    runCustomHashtagScript: (
        script: string[],
        props: StepLabelPropsType,
        convertListStringToObj: (listParm: string[]) => object,
    ) => boolean | string,
) {
    HashtagScript.add(runCustomHashtagScript);
}
