import { translator } from "@drincs/pixi-vn-json"
import { onInkTranslate } from "./translate"

/**
 * This function is called after the {@link onInkTranslate} function is called.
 * It will replace the text between curly braces.
 * It can be used for example to replace the character id with the character name:
 * If there are a character with a name "John" and id "john", and the text is "Hello, my name is [john]",
 * the following function will return "Hello, my name is John"
 * @param getTextToReplace The function to get the text to replace 
 * @example
 * ```ts
 * import { onGetCharacterText } from 'pixi-vn-ink'
 * import { getCharacterById } from "@drincs/pixi-vn";
 * 
 * onGetCharacterText((key) => {
 *     let character = getCharacterById(key)
 *     if (character) {
 *         return character.name
 *     }
 *
 *     // if return undefined, the system will not replace the character id
 *     return undefined
 * })
 * ```
 */
export function onReplaceTextAfterTranslation(
    getTextToReplace: (
        /**
         * The key to be replaced
         */
        key: string,
    ) => string | undefined
) {
    translator.afterToTranslate = (text) => {
        return replaceText(text, getTextToReplace)
    }
}

/**
 * This function is called before the {@link onInkTranslate} function is called.
 * It will replace the text between curly braces.
 * It can be used for example to replace the normal method for replacing the text [key] with a new method to replace the text {{key}}.
 * It can be used for example to optimize the text replacement with i18next, using the {@link onInkTranslate} function.
 * If there are a text is "Hello, my name is [john]", the following function will return "Hello, my name is {{john}}"
 * @param getTextToReplace The function to get the text to replace
 * @example
 * ```ts
 * import { onReplaceTextBeforeTranslation, onInkTranslate } from 'pixi-vn-ink'
 * import { useTranslation } from "react-i18next";
 * import { john } from "../values/characters"
 * 
 * const { t } = useTranslation(["narration"]);
 * 
 * onInkTranslate((text) => {
 *     return t(text, { 
 *         john: john.name
 *     })
 * })
 * 
 * onReplaceTextBeforeTranslation((key) => {
 *     return `{{${key}}}`
 * })
 * ```
 */
export function onReplaceTextBeforeTranslation(
    getTextToReplace: (
        /**
         * The key to be replaced
         */
        key: string,
    ) => string | undefined
) {
    translator.beforeToTranslate = (text) => {
        return replaceText(text, getTextToReplace)
    }
}

/**
 * Function that replaces the text between curly braces with the { @link TextReplacesManager._getTextToReplace } function.
 * For example, if there are a character with a name "John" and id "john", and the text is "Hello, my name is [john]"
 * The function will return "Hello, my name is John"
 * @param text 
 */
function replaceText(text: string, getTextToReplace: (key: string) => string | undefined): string {
    let matches = text.match(/\[([^\]]+)\]/)
    if (matches) {
        let characterId = matches[1]
        let character = getTextToReplace(characterId)
        if (character) {
            text = text.replace(matches[0], character)
        }
    }
    return text
}
