import { StepLabelPropsType } from "@drincs/pixi-vn";

type HashtagHandler = (
    /**
     * A Hashtag-Command to run. It corresponds to a line of code that starts with `#`.
     * This is an array of strings, it is the Hashtag-Command that was split by spaces. For add a space in a string, you need to use `""`.
     * For example, the Hashtag-Command `# command "Hello World"` will be split into `["command", "Hello World"]`.
     */
    command: string[],
    /**
     * The properties of the step. It is an object that contains the properties of the step.
     */
    props: StepLabelPropsType,
    /**
     * It is often useful after writing a basic Hashtag-Command to add parameters with the following logic: "field name" "value".
     * Furthermore, these parameters can be written in a different order, to simplify writing.
     * This function is used to convert an array that has the following logic into a json. Here is an example:
     * This is the array: `["name", "John", "age", "20", "position", "{ x: 2, y 3 }"]` and this is the json: `{name: "John", age: 20, position: { x: 2, y: 3 }}`.
     */
    convertListStringToObj: (listParm: string[]) => object,
) => boolean | string;
export default HashtagHandler;
