export type ReplaceHandler = (
    /**
     * The key to be replaced
     */
    key: string,
) => string | undefined;

export type ReplaceHandlerOptions = {
    name: string;
    description?: string;
    regexValidation: RegExp;
    /**
     * @default "before-translation"
     */
    type?: "after-translation" | "before-translation";
};
