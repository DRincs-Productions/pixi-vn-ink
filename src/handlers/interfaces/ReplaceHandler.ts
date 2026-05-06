import type { ZodType } from "zod";

/**
 * A handler function invoked for each `[key]` token found in the text that passes the
 * {@link ReplaceHandlerOptions.validation} check.
 *
 * @param key The content found inside the square brackets (without the brackets themselves).
 *   For example, for the token `[john]` the key is `"john"`.
 * @returns The string to substitute in place of `[key]`, or `undefined` to leave the token unchanged.
 */
export type ReplaceHandler = (
    /**
     * The key to be replaced
     */
    key: string,
) => string | undefined;

/**
 * Configuration options for a text-replacement handler registered via {@link TextReplaces.add}.
 */
export type ReplaceHandlerOptions = {
    /**
     * A unique name that identifies this handler.
     * Used for documentation and debugging purposes.
     */
    name: string;
    /**
     * An optional human-readable description of what this handler does.
     * Used for documentation purposes.
     */
    description?: string;
    /**
     * Determines whether this handler should be invoked for a given `[key]` token.
     *
     * - `"all"` – the handler is always invoked for every token found.
     * - `"characterId"` – the handler is invoked only when the key matches a registered character ID
     *   (i.e. the character is present in `RegisteredCharacters`).
     * - `RegExp` – the key string is tested against the regular expression. The handler is invoked
     *   only if the regex matches.
     * - `ZodType<string>` – the key string is validated with `schema.safeParse(key)`. The handler
     *   is invoked only if validation succeeds.
     *
     * @example
     * ```ts
     * // RegExp: only replace keys that look like lowercase identifiers
     * validation: /^[a-z_]+$/
     *
     * // Zod: only replace keys that are one of a fixed set of values
     * import { z } from "zod"
     * validation: z.enum(["player", "npc", "enemy"])
     * ```
     */
    validation: RegExp | "characterId" | "all" | ZodType<string>;
    /**
     * When this handler should be invoked relative to the translation step.
     *
     * - `"before-translation"` – the handler runs **before** {@link onInkTranslate} is called.
     *   Useful for pre-processing tokens, e.g. converting `[key]` into `{{key}}` for i18next.
     * - `"after-translation"` – the handler runs **after** {@link onInkTranslate} is called.
     *   Useful for substituting values that depend on the translated text.
     *
     * @default "before-translation"
     */
    type?: "after-translation" | "before-translation";
};
