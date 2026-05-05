import { TEXT_TO_REPLACE_REGEX } from "@/constant";
import type { ReplaceHandler, ReplaceHandlerOptions } from "@/handlers/interfaces/ReplaceHandler";
import { translator } from "@drincs/pixi-vn-json/translator";
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
 * Recursively replaces text between square brackets using the provided handler.
 * @param text The source text
 * @param getTextToReplace The function to get the replacement string for a given key
 */
function legacyReplaceText(
    text: string,
    getTextToReplace: (key: string) => string | undefined,
): string {
    const processedKeys = new Set<string>();
    return legacyReplaceTextRecursive(text, getTextToReplace, processedKeys);
}

/**
 * Recursive implementation of {@link legacyReplaceText}.
 * Tracks already-attempted keys to avoid infinite loops when a handler returns `undefined`.
 */
function legacyReplaceTextRecursive(
    text: string,
    getTextToReplace: (key: string) => string | undefined,
    processedKeys: Set<string>,
): string {
    const match = text.match(TEXT_TO_REPLACE_REGEX);
    if (!match) return text;

    const key = match[1];
    if (processedKeys.has(key)) {
        // Skip keys whose handler returned undefined to prevent infinite loops
        return text;
    }

    const replacement = getTextToReplace(key);
    if (replacement !== undefined) {
        text = text.replaceAll(match[0], replacement);
    } else {
        processedKeys.add(key);
    }
    return legacyReplaceTextRecursive(text, getTextToReplace, processedKeys);
}

/**
 * Manages text replacement handlers that process content enclosed in square brackets (`[key]`).
 *
 * Handlers are called in the order they were added. For each handler, the current text is scanned
 * for all `[key]` patterns. If the handler's `regexValidation` matches a key, the handler is
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
 *         regexValidation: /^[a-z_]+$/,
 *         type: "after-translation",
 *     }
 * )
 * // "Hello [john], meet [jane]!" -> "Hello John, meet Jane!"
 * ```
 */
export namespace TextReplaces {
    /** The regex used to find replacement tokens in the text (e.g. `[key]`). */
    export const options = { replaceRegex: /\[([^\]]+)\]/ };

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
     * is registered, the corresponding translator hook is automatically wired up.
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
     *         regexValidation: /^player$/,
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
     * 2. For each unique key, the handler's `regexValidation` is tested against the key.
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
            text = applyHandler(text, handler.fn, handler.opts.regexValidation);
        }

        return text;
    }

    /**
     * Applies a single handler to the text by scanning all `[key]` tokens, validating each
     * against the handler's regex, and performing replacements.
     *
     * @param text The source text.
     * @param fn The handler function.
     * @param regexValidation The regex used to decide whether this handler should process a key.
     * @returns The text after the handler has been applied to all matching tokens.
     */
    function applyHandler(text: string, fn: ReplaceHandler, regexValidation: RegExp): string {
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
            if (!regexValidation.test(key)) continue;
            const replacement = fn(key);
            if (replacement !== undefined) {
                text = text.replaceAll(`[${key}]`, replacement);
            }
        }

        return text;
    }
}

/**
 * @deprecated Use {@link TextReplaces} instead.
 *
 * Legacy alias kept for backwards compatibility.
 */
export const TextReplacesManager = TextReplaces;
