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
     * The regex to validate the key. If the key does not match the regex, it will not be replaced.
     * @example
     * ```ts
     * regexValidation: /^[a-zA-Z0-9_]+$/
     * ```
     */
    regexValidation: RegExp | "characterId" | "all";
    /**
     * The type of the handler. It will be used to identify when the handler will be called. If the type is "before-translation", the handler will be called before the translation. If the type is "after-translation", the handler will be called after the translation.
     * @default "before-translation"
     */
    type?: "after-translation" | "before-translation";
};
