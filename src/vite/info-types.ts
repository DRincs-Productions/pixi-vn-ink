/**
 * Serializable representation of a registered {@link HashtagCommands} handler,
 * as exposed by the pixi-vn-ink Vite dev-server API.
 *
 * Instances of this type are returned by
 * `GET /pixi-vn-ink/hashtag-commands`
 * and accepted by
 * `POST /pixi-vn-ink/hashtag-commands`.
 *
 * @see https://pixi-vn.web.app/ink#vite-plugin
 */
export interface InkHashtagCommandInfo {
    /**
     * Unique name that identifies the handler.
     * Matches {@link HashtagHandlerOptions.name}.
     */
    name: string;
    /**
     * Human-readable description of what the handler does.
     * Matches {@link HashtagHandlerOptions.description}.
     */
    description?: string;
}

/**
 * Serializable representation of a registered {@link TextReplaces} handler,
 * as exposed by the pixi-vn-ink Vite dev-server API.
 *
 * Instances of this type are returned by
 * `GET /pixi-vn-ink/text-replaces`
 * and accepted by
 * `POST /pixi-vn-ink/text-replaces`.
 *
 * @see https://pixi-vn.web.app/ink#vite-plugin
 */
export interface InkTextReplaceInfo {
    /**
     * Unique name that identifies the handler.
     * Matches {@link ReplaceHandlerOptions.name}.
     */
    name: string;
    /**
     * Human-readable description of what the handler does.
     * Matches {@link ReplaceHandlerOptions.description}.
     */
    description?: string;
    /**
     * When the handler runs relative to the translation step.
     * Matches {@link ReplaceHandlerOptions.type}.
     * @default "before-translation"
     */
    type?: "before-translation" | "after-translation";
}
