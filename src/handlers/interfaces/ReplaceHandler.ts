export type ReplaceHandler = (
    /**
     * The key to be replaced
     */
    key: string,
) => string | undefined;

/**
 * The options to create a replace handler. It will be used to identify the handler and to validate the key.
 */
export type ReplaceHandlerOptions = {
    /**
     * The name of the handler. It will be used in the documentation and in the system to identify the handler.
     */
    name: string;
    /**
     * A description of the handler. It will be used in the documentation and in the system to identify the handler.
     */
    description?: string;
    /**
     * The validation of the key. It will be used to validate the key before replacing it. It can be a regular expression, "characterId" or "all". If it is a regular expression, the key will be validated against the regular expression. If it is "characterId", the key will be validated as a character id. If it is "all", the key will be valid for all the keys.
     * @example
     * ```ts
     * regexValidation: /^[a-zA-Z0-9_]+$/
     * ```
     */
    validation: RegExp | "characterId" | "all";
    /**
     * The type of the handler. It will be used to identify when the handler will be called. If the type is "before-translation", the handler will be called before the translation. If the type is "after-translation", the handler will be called after the translation.
     * @default "before-translation"
     */
    type?: "after-translation" | "before-translation";
};
