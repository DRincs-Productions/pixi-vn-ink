import RootParserItemType from "./RootParserItemType"

/**
 * Generates an instance of a Choice. Its exact behaviour depends on its flags. It doesn't contain any text itself, since choice text is generated at runtime and added to the evaluation stack. When a ChoicePoint is encountered, it pops content off the evaluation stack according to its flags, which indicate which texts are needed.
 * 
 * A ChoicePoint object's structure in JSON is:
 * ```json
 * {
 *     "*": "path.when.chosen",
 *     "flg": 18
 * }
 * ```
 * The path when chosen is the target path of a Container of content, and is assigned when calling ChooseChoiceIndex.
 */
type ChoicePoint = {
    "*": string,
    /**
     * The flg field is a bitfield of flags:
     * - 0x1 - Has condition?: Set if the story should pop a value from the evaluation stack in order to determine whether a choice instance should be created at all.
     * - 0x2 - Has start content? - According to square bracket notation, is there any leading content before any square brackets? If so, this content should be popped from the evaluation stack.
     * - 0x4 - Has choice-only content? - According to square bracket notation, is there any content between the square brackets? If so, this content should be popped from the evaluation stack.
     * - 0x8 - Is invisible default? - When this is enabled, the choice isn't provided to the game (isn't presented to the player), and instead is automatically followed if there are no other choices generated.
     * - 0x10 - Once only? - Defaults to true. This is the difference between the * and + choice bullets in ink. If once only (*), the choice is only displayed if its target container's read count is zero.
     */
    flg: number
}
export default ChoicePoint
export type ChoiceInfo = { s: RootParserItemType[] }
