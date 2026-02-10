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
        /**
         * A Hashtag-Script to run. It corresponds to a line of code that starts with `#`.
         * This is an array of strings, it is the Hashtag-Script that was split by spaces. For add a space in a string, you need to use `""`.
         * For example, the Hashtag-Script `# command "Hello World"` will be split into `["command", "Hello World"]`.
         */
        script: string[],
        /**
         * The properties of the step. It is an object that contains the properties of the step.
         */
        props: StepLabelPropsType,
        /**
         * It is often useful after writing a basic Hashtag-Script to add parameters with the following logic: "field name" "value".
         * Furthermore, these parameters can be written in a different order, to simplify writing.
         * This function is used to convert an array that has the following logic into a json. Here is an example:
         * This is the array: `["name", "John", "age", "20", "position", "{ x: 2, y 3 }"]` and this is the json: `{name: "John", age: 20, position: { x: 2, y: 3 }}`.
         */
        convertListStringToObj: (listParm: string[]) => object,
    ) => boolean | string,
) {
    HashtagScript.add(runCustomHashtagScript);
}
