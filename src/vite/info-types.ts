/**
 * Serializable representation of a handler `validation` rule used by
 * {@link HashtagCommands} and {@link TextReplaces}.
 */
export type InkValidationInfo =
    | {
          /**
           * Validation based on regular expression.
           */
          type: "regexp";
          /**
           * The regex source pattern.
           */
          source: string;
          /**
           * Regex flags (for example `"i"` or `"gi"`).
           */
          flags: string;
      }
    | {
          /**
           * Validation based on a Zod schema serialized to JSON Schema.
           */
          type: "zod";
          /**
           * JSON Schema representation of the original Zod validation.
           */
          schema: Record<string, unknown>;
      }
    | {
          /**
           * Validation represented by a string literal value
           * (e.g. `"all"` or `"characterId"`).
           */
          type: "literal";
          /**
           * The original literal validation value.
           */
          value: string;
      };

/**
 * Serializable representation of a registered {@link HashtagCommands} handler,
 * as exposed by the pixi-vn-ink Vite dev-server API.
 *
 * Instances of this type are returned by
 * `GET /__pixi-vn-ink/hashtag-commands`
 * and accepted by
 * `POST /__pixi-vn-ink/hashtag-commands`.
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
    /**
     * Serializable form of {@link HashtagHandlerOptions.validation}.
     */
    validation: InkValidationInfo;
}

/**
 * Serializable representation of a registered {@link TextReplaces} handler,
 * as exposed by the pixi-vn-ink Vite dev-server API.
 *
 * Instances of this type are returned by
 * `GET /__pixi-vn-ink/text-replaces`
 * and accepted by
 * `POST /__pixi-vn-ink/text-replaces`.
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
     * Serializable form of {@link ReplaceHandlerOptions.validation}.
     */
    validation: InkValidationInfo;
    /**
     * When the handler runs relative to the translation step.
     * Matches {@link ReplaceHandlerOptions.type}.
     * @default "before-translation"
     */
    type?: "before-translation" | "after-translation";
}
