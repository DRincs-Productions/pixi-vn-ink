/// <reference types="vite/client" />
import { HashtagCommands } from "@/handlers/hashtag-commands";
import { importInkText, importJson } from "@/loader/importer";
import { INK_DEV_API_HASHTAG_COMMANDS, INK_DEV_API_TEXT_REPLACES } from "@/vite/costants";
import type {
    InkHashtagCommandInfo,
    InkTextReplaceInfo,
    InkValidationInfo,
} from "@/vite/info-types";
import { TextReplaces } from "@drincs/pixi-vn-json";
import type { PixiVNJson } from "@drincs/pixi-vn-json";
import z from "zod";

type InkJsonManifestMap = Record<string, string>;
type SetupInkHmrListenerOptions = {
    inkJsonManifest?: InkJsonManifestMap;
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

async function importJsonFromManifest(inkJsonManifest?: InkJsonManifestMap): Promise<boolean> {
    if (!import.meta.hot) {
        return false;
    }

    try {
        if (inkJsonManifest === undefined) {
            return false;
        }
        const manifestPaths = Object.values(inkJsonManifest).filter(
            (entry): entry is string => typeof entry === "string" && entry.length > 0,
        );

        if (manifestPaths.length === 0) {
            return true;
        }

        const loadedStories: PixiVNJson[] = (
            await Promise.all(
                manifestPaths.map(async (url) => {
                    try {
                        const response = await fetch(url);
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }
                        return await response.json();
                    } catch (error) {
                        console.warn(
                            `[pixi-vn-ink] Failed to load Ink JSON "${url}" from inkJsonManifest.`,
                            error,
                        );
                        return null;
                    }
                }),
            )
        )
            .filter(
                (story): story is PixiVNJson =>
                    typeof story === "object" && story !== null && !Array.isArray(story),
            );

        if (loadedStories.length === 0) {
            return true;
        }

        await importJson(loadedStories);
        return true;
    } catch (error) {
        console.warn("[pixi-vn-ink] Failed to import Ink JSON from inkJsonManifest.", error);
        return false;
    }
}

/**
 * Setup listener for ink updates via HMR
 * @see https://pixi-vn.web.app/ink#vite-plugin
 * @param options Optional setup options.
 * @example
 * // In your main entry file (e.g., main.ts)
 * import { setupInkHmrListener } from "@drincs/pixi-vn-ink/vite";
 *
 * setupInkHmrListener({
 *   inkJsonManifest: {
 *     start: "/ink-json/start.json",
 *     chapter1: "/ink-json/chapter1.json",
 *   },
 * });
 */
export function setupInkHmrListener(options?: SetupInkHmrListenerOptions) {
    const { inkJsonManifest } = options ?? {};
    if (import.meta.hot) {
        void importJsonFromManifest(inkJsonManifest);
        void syncHandlerInfoToDevServer();

        import.meta.hot.on("ink-updated", async (inkText) => {
            const hasInkJsonManifest = await importJsonFromManifest(inkJsonManifest);
            if (!hasInkJsonManifest) {
                await importInkText(inkText);
            }
            void syncHandlerInfoToDevServer();
        });
    }
}
