import { StepLabelPropsType } from "@drincs/pixi-vn";
import CommandManager from "../managers/CommandManager";

/**
 * This function is called before the system interprets a possible command that starts with `#`.
 * The developer can use this function to run a custom command. If the function returns `true`, the system will not interpret the command.
 * @param runCustomCommand The function to run a custom command
 * @example
 * ```ts
 * import { onInkCustomCommand } from 'pixi-vn-ink'
 * 
 * onInkCustomCommand((command, convertListStringToObj) => {
 *    // command: # navigate scene_name prop1 "value 1" prop2 "value 2"
 *    if (command[0] === "navigate" && command.length > 1) {
 *        let prop = undefined
 *        if (command.length > 2) {
 *            prop = convertListStringToObj(command.slice(2))
 *        }
 *        navigateTo(command[1], prop)
 *    }
 * })
 * ```
 */
export function onInkCustomCommand(
    runCustomCommand: (
        /**
         * A Command to run. It corresponds to a line of code that starts with `#`.
         * This is an array of strings, it is the command that was split by spaces. For add a space in a string, you need to use `""`.
         * For example, the command `# command "Hello World"` will be split into `["command", "Hello World"]`.
         */
        command: string[],
        /**
         * The properties of the step. It is an object that contains the properties of the step.
         */
        props: {} | StepLabelPropsType,
        /**
         * It is often useful after writing a basic command to add parameters with the following logic: "field name" "value".
         * Furthermore, these parameters can be written in a different order, to simplify writing.
         * This function is used to convert an array that has the following logic into a json. Here is an example:
         * This is the array: `["name", "John", "age", "20", "position", "{ x: 2, y 3 }"]` and this is the json: `{name: "John", age: 20, position: { x: 2, y: 3 }}`.
         */
        convertListStringToObj: (listParm: string[]) => object
    ) => boolean
) {
    CommandManager.customCommand = runCustomCommand
}
