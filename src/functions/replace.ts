import { TEXT_TO_REPLACE_REGEX } from "@/constant";
import type { ReplaceHandler, ReplaceHandlerOptions } from "@/handlers/interfaces/ReplaceHandler";
import { translator } from "@drincs/pixi-vn-json/translator";
import { RegisteredCharacters } from "@drincs/pixi-vn/characters";
import { ZodType } from "zod";
import { onInkTranslate } from "./translate";

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

/**
 * Manages text replacement handlers that process content enclosed in square brackets (`[key]`).
 *
 * Handlers are called in the order they were added. For each handler, the current text is scanned
 * for all `[key]` patterns. If the handler's `validation` matches a key, the handler is
 * invoked with that key. If the handler returns a string, all occurrences of `[key]` are replaced
 * with the returned value. After a handler finishes processing the text, the next handler starts
 * on the updated text.
 *
 * Each handler specifies whether it runs before or after translation via the `type` field in its
 * options (defaults to `"before-translation"`).
 *
 * @example
 * ```ts
 * import { TextReplaces } from 'pixi-vn-ink'
 * import { getCharacterById } from "@drincs/pixi-vn";
 *
 * // Replace [characterId] with the character's display name
 * TextReplaces.add(
 *     (key) => {
 *         const character = getCharacterById(key)
 *         return character?.name
 *     },
 *     {
 *         name: "character-name",
 *         description: "Replaces character IDs with their display names",
 *         validation: /^[a-z_]+$/,
 *         type: "after-translation",
 *     }
 * )
 * // "Hello [john], meet [jane]!" -> "Hello John, meet Jane!"
 * ```
 */
export namespace TextReplaces {
    /**
     * Configuration options for the `TextReplaces` system.
     */
    export const options = {
        /**
         * The regex used to find replacement tokens in the text (e.g. `[key]`).
         * @default /\[([^\]]+)\]/
         */
        replaceRegex: /\[([^\]]+)\]/,
    };

    /** Internal registry of handlers in insertion order. */
    const _handlers: { fn: ReplaceHandler; opts: ReplaceHandlerOptions }[] = [];

    /** Whether the before-translation translator hook has been initialised. */
    let _beforeHookInitialised = false;
    /** Whether the after-translation translator hook has been initialised. */
    let _afterHookInitialised = false;

    /**
     * Registers a new replacement handler.
     *
     * Handlers are executed in the order they are added. The first handler added runs first.
     *
     * When the first handler of a given type (`"before-translation"` or `"after-translation"`)
     * is registered, the corresponding translator hook (`translator.beforeToTranslate` or
     * `translator.afterToTranslate`) is automatically set so that `TextReplaces` takes exclusive
     * ownership of that hook. Do **not** mix `TextReplaces` with the deprecated
     * {@link onReplaceTextBeforeTranslation} / {@link onReplaceTextAfterTranslation} functions
     * for the same phase, as they will overwrite each other's hook.
     *
     * @param fn The handler function. Receives the key found inside `[...]` and should return
     *   the replacement string, or `undefined` to leave that token unchanged.
     * @param handlerOptions Configuration for this handler, including its name, optional
     *   description, validation regex, and execution phase.
     * @example
     * ```ts
     * import { TextReplaces } from 'pixi-vn-ink'
     *
     * TextReplaces.add(
     *     (key) => key === "player" ? "Mario" : undefined,
     *     {
     *         name: "player-name",
     *         validation: /^player$/,
     *     }
     * )
     * ```
     */
    export function add(fn: ReplaceHandler, handlerOptions: ReplaceHandlerOptions): void {
        _handlers.push({ fn, opts: handlerOptions });

        const type = handlerOptions.type ?? "before-translation";
        if (type === "before-translation" && !_beforeHookInitialised) {
            translator.beforeToTranslate = (text) => replace(text, { type: "before-translation" });
            _beforeHookInitialised = true;
        } else if (type === "after-translation" && !_afterHookInitialised) {
            translator.afterToTranslate = (text) => replace(text, { type: "after-translation" });
            _afterHookInitialised = true;
        }
    }

    /**
     * Removes a previously registered handler function.
     *
     * Only the first registration matching `fn` is removed. If the same function was added
     * multiple times, subsequent registrations remain.
     *
     * @param fn The handler function to remove.
     */
    export function remove(fn: ReplaceHandler): void {
        const index = _handlers.findIndex((h) => h.fn === fn);
        if (index !== -1) {
            _handlers.splice(index, 1);
        }
    }

    /**
     * Returns metadata for all registered handlers, in registration order.
     *
     * @returns An array of {@link ReplaceHandlerOptions} for each registered handler.
     */
    export function info(): ReplaceHandlerOptions[] {
        return _handlers.map((h) => h.opts);
    }

    /**
     * Applies all registered handlers of the specified type to the given text in order.
     *
     * For each handler:
     * 1. All `[key]` tokens currently present in the text are collected.
     * 2. For each unique key, the handler's `validation` is tested against the key.
     * 3. If validation passes, the handler is called with the key.
     * 4. If the handler returns a string, **all** occurrences of `[key]` in the text are
     *    replaced with that string.
     * 5. After the handler has processed all tokens, the next handler starts on the updated text.
     *
     * @param text The source text to process.
     * @param replaceOptions Specifies which phase of handlers to run.
     * @returns The text after all matching handlers have been applied.
     * @example
     * ```ts
     * // Given handlers that replace [name] -> "Mario" and [surname] -> "Rossi":
     * TextReplaces.replace("Ciao [name] [surname]. [name] vai pure", { type: "before-translation" })
     * // => "Ciao Mario Rossi. Mario vai pure"
     * ```
     */
    export function replace(
        text: string,
        replaceOptions: {
            /** Which phase of handlers to execute. */
            type: "after-translation" | "before-translation";
        },
    ): string {
        const activeHandlers = _handlers.filter(
            (h) => (h.opts.type ?? "before-translation") === replaceOptions.type,
        );

        for (const handler of activeHandlers) {
            text = applyHandler(text, handler.fn, handler.opts.validation);
        }

        return text;
    }

    /**
     * Applies a single handler to the text by scanning all `[key]` tokens, validating each
     * against the handler's validation option, and performing replacements.
     *
     * Validation rules:
     * - `"all"` – every key is passed to the handler.
     * - `"characterId"` – the key is passed only if it matches a registered character ID.
     * - `RegExp` – the key is passed only if the regex matches it.
     * - `ZodType<string>` – the key is passed only if `schema.safeParse(key)` succeeds.
     *
     * @param text The source text.
     * @param fn The handler function.
     * @param validation The validation rule to apply to each key.
     * @returns The text after the handler has been applied to all matching tokens.
     */
    function applyHandler(
        text: string,
        fn: ReplaceHandler,
        validation: RegExp | "characterId" | "all" | ZodType<string>,
    ): string {
        const globalRegex = new RegExp(options.replaceRegex.source, "g");
        // Collect all unique keys currently in the text, preserving encounter order.
        const allMatches = [...text.matchAll(globalRegex)];
        const seenKeys = new Set<string>();
        const uniqueKeys: string[] = [];
        for (const m of allMatches) {
            if (!seenKeys.has(m[1])) {
                seenKeys.add(m[1]);
                uniqueKeys.push(m[1]);
            }
        }

        for (const key of uniqueKeys) {
            if (validation === "characterId") {
                if (!RegisteredCharacters.has(key)) continue;
            } else if (validation !== "all") {
                if (validation instanceof RegExp) {
                    if (!validation.test(key)) continue;
                } else if (validation instanceof ZodType) {
                    const result = validation.safeParse(key);
                    if (!result.success) continue;
                }
            }
            const replacement = fn(key);
            if (replacement !== undefined) {
                text = text.replaceAll(`[${key}]`, replacement);
            }
        }

        return text;
    }
}
