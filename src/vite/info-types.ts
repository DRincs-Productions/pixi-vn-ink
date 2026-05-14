import type { InkValidationInfo } from "@/parser/types";

export type { InkHashtagCommandInfo, InkValidationInfo } from "@drincs/pixi-vn-ink/parser";

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
