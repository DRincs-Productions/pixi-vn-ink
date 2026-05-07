import { TEXT_TO_REPLACE_REGEX } from "@/constant";
import { onInkTranslate } from "@/functions/translate";
import { translator } from "@drincs/pixi-vn-json/translator";

/**
 * @deprecated Use {@link TextReplaces} instead.
 *
 * This function is called after the {@link onInkTranslate} function is called.
 * It will replace the text between square brackets.
 * It can be used for example to replace the character id with the character name:
 * If there are a character with a name "John" and id "john", and the text is "Hello, my name is [john]",
 * the following function will return "Hello, my name is John"
 * @param getTextToReplace The function to get the text to replace
 * @example
 * ```ts
 * import { onReplaceTextAfterTranslation } from 'pixi-vn-ink'
 * import { getCharacterById } from "@drincs/pixi-vn";
 *
 * onReplaceTextAfterTranslation((key) => {
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
    ) => string | undefined,
) {
    translator.afterToTranslate = (text) => {
        return legacyReplaceText(text, getTextToReplace);
    };
}

/**
 * @deprecated Use {@link TextReplaces} instead.
 *
 * This function is called before the {@link onInkTranslate} function is called.
 * It will replace the text between square brackets.
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
    ) => string | undefined,
) {
    translator.beforeToTranslate = (text) => {
        return legacyReplaceText(text, getTextToReplace);
    };
}

/**
 * Internal helper used by the deprecated {@link onReplaceTextAfterTranslation} and
 * {@link onReplaceTextBeforeTranslation} functions.
 * Iteratively replaces all `[key]` tokens in the text using the provided handler.
 * Keys for which the handler returns `undefined` are tracked so they are never retried,
 * preventing infinite loops. The loop continues until no further replacements can be made,
 * allowing newly-introduced `[key]` tokens (produced by previous replacements) to be processed.
 * @param text The source text
 * @param getTextToReplace The function to get the replacement string for a given key
 */
function legacyReplaceText(
    text: string,
    getTextToReplace: (key: string) => string | undefined,
): string {
    const globalRegex = new RegExp(TEXT_TO_REPLACE_REGEX.source, "g");
    const skippedKeys = new Set<string>();
    let changed = true;

    while (changed) {
        changed = false;
        const allMatches = [...text.matchAll(globalRegex)];
        const seenKeys = new Set<string>();

        for (const match of allMatches) {
            const key = match[1];
            if (seenKeys.has(key) || skippedKeys.has(key)) continue;
            seenKeys.add(key);

            const replacement = getTextToReplace(key);
            if (replacement !== undefined) {
                text = text.replaceAll(match[0], replacement);
                changed = true;
            } else {
                skippedKeys.add(key);
            }
        }
    }

    return text;
}
