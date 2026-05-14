/// <reference types="vite/client" />
import { HashtagCommands } from "@/handlers/hashtag-commands";
import { importInkText } from "@/loader/importer";
import { INK_DEV_API_GENERATE_JSON, INK_DEV_API_HASHTAG_COMMANDS, INK_DEV_API_TEXT_REPLACES } from "@/vite/costants";
import type {
    InkHashtagCommandInfo,
    InkTextReplaceInfo,
    InkValidationInfo,
} from "@/vite/info-types";
import { TextReplaces } from "@drincs/pixi-vn-json";
import z from "zod";

function serializeValidation(validation: unknown): InkValidationInfo {
    if (validation instanceof RegExp) {
        return {
            type: "regexp",
            source: validation.source,
            flags: validation.flags,
        };
    }
    if (typeof validation === "string") {
        return {
            type: "literal",
            value: validation,
        };
    }
    if (
        validation &&
        typeof validation === "object" &&
        "_zod" in (validation as Record<string, unknown>)
    ) {
        try {
            return {
                type: "zod",
                schema: z.toJSONSchema(validation as z.core.$ZodType),
            };
        } catch {
            // Fall through to literal fallback
        }
    }
    return {
        type: "literal",
        value: String(validation),
    };
}
/**
 * Serializes the currently registered handler lists and POSTs them to the
 * pixi-vn-ink Vite dev-server API so that external tools such as VS Code
 * extensions can read them via the corresponding GET endpoints.
 *
 * Both requests are fire-and-forget; failures are silently ignored so that a
 * missing or unreachable dev server never breaks the running application.
 */
async function syncHandlerInfoToDevServer(): Promise<void> {
    if (!import.meta.hot) {
        return;
    }

    const hashtagInfo: InkHashtagCommandInfo[] = HashtagCommands.info().map(
        ({ name, description, validation }) => ({
            name,
            description,
            validation: serializeValidation(validation),
        }),
    );

    const textReplaceInfo: InkTextReplaceInfo[] = TextReplaces.info().map(
        ({ name, description, type, validation }) => ({
            name,
            description,
            type,
            validation: serializeValidation(validation),
        }),
    );

    await Promise.allSettled([
        fetch(INK_DEV_API_HASHTAG_COMMANDS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(hashtagInfo),
        }),
        fetch(INK_DEV_API_TEXT_REPLACES, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(textReplaceInfo),
        }),
    ]);
}

/**
 * Calls the pixi-vn-ink Vite dev-server API to trigger the generation of JSON
 * files from matched `.ink` sources. The server will first attempt to read
 * registered characters via `GET /__pixi-vn/characters` before converting.
 *
 * Fire-and-forget; failures are silently ignored.
 */
async function triggerInkJsonGeneration(): Promise<void> {
    if (!import.meta.hot) {
        return;
    }
    await fetch(INK_DEV_API_GENERATE_JSON, { method: "POST" }).catch(() => undefined);
}

/**
 * Setup listener for ink updates via HMR
 * @see https://pixi-vn.web.app/ink#vite-plugin
 * @example
 * // In your main entry file (e.g., main.ts)
 * import { setupInkHmrListener } from "@drincs/pixi-vn-ink/vite";
 *
 * setupInkHmrListener();
 */
export function setupInkHmrListener() {
    if (import.meta.hot) {
        void syncHandlerInfoToDevServer().then(() => triggerInkJsonGeneration());

        import.meta.hot.on("ink-updated", async (inkText) => {
            await importInkText(inkText);
            void syncHandlerInfoToDevServer();
        });
    }
}
