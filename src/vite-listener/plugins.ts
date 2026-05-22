/// <reference types="vite/client" />
import { HashtagCommands } from "@/handlers/hashtag-commands";
import { importInkText, importJson } from "@/loader/importer";
import {
    INK_DEV_API_CHARACTERS,
    INK_DEV_API_HASHTAG_COMMANDS,
    INK_DEV_API_TEXT_REPLACES,
} from "@/vite/costants";
import type {
    InkHashtagCommandInfo,
    InkTextReplaceInfo,
    InkValidationInfo,
} from "@/vite/info-types";
import type { PixiVNJson } from "@drincs/pixi-vn-json";
import { PIXIVN_DEV_API_CHARACTERS } from "@drincs/pixi-vn/vite";
import { TextReplaces } from "@drincs/pixi-vn-json";
import { inkJsons } from "virtual:pixi-vn-ink";
import z from "zod";

type InkUpdatedPayload = {
    inkText?: string;
    inkJson?: PixiVNJson[];
};

type InkUpdatedPayloadHandlers = {
    importJson: (inkJson: PixiVNJson[]) => Promise<void>;
    importInkText: (inkText: string) => Promise<unknown>;
};

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
async function syncCharactersToDevServer(): Promise<void> {
    if (!import.meta.hot) return;
    try {
        const response = await fetch(PIXIVN_DEV_API_CHARACTERS);
        if (response.ok) {
            const characters = await response.json();
            await fetch(INK_DEV_API_CHARACTERS, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(characters),
            });
        }
    } catch {
        // silently ignore
    }
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

export async function handleInkUpdatedPayload(
    payload: string | InkUpdatedPayload,
    handlers: InkUpdatedPayloadHandlers = {
        importJson: async (data) => {
            await importJson(data);
        },
        importInkText,
    },
): Promise<void> {
    const inkJson =
        payload && typeof payload === "object" && "inkJson" in payload
            ? payload.inkJson
            : undefined;

    if (inkJson && inkJson.length > 0) {
        await handlers.importJson(inkJson);
        return;
    }

    const inkText =
        payload && typeof payload === "object" && "inkText" in payload
            ? payload.inkText
            : typeof payload === "string"
              ? payload
              : undefined;

    if (typeof inkText === "string") {
        await handlers.importInkText(inkText);
    }
}

/**
 * Setup listener for ink updates via HMR
 * @see https://pixi-vn.web.app/ink#vite-plugin
 * @example
 * // In your main entry file (e.g., main.ts)
 * import { setupPixivnViteData } from "@drincs/pixi-vn/vite";
 * import { setupInkHmrListener } from "@drincs/pixi-vn-ink/vite";
 *
 * await setupPixivnViteData();
 * await setupInkHmrListener();
 */
export async function setupInkHmrListener() {
    if (import.meta.hot) {
        if (inkJsons && inkJsons.length > 0) {
            await importJson(inkJsons);
        }
        await syncHandlerInfoToDevServer();
        await syncCharactersToDevServer();

        import.meta.hot.on("ink-updated", async (payload: string | InkUpdatedPayload) => {
            await handleInkUpdatedPayload(payload);
            await syncHandlerInfoToDevServer();
        });

        import.meta.hot.on("ink-error-cleared", () => {
            document.querySelectorAll("vite-error-overlay").forEach((el) => {
                (el as HTMLElement & { close(): void }).close();
            });
        });
    }
}
