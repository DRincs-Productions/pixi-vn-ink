/// <reference types="vite/client" />
import { HashtagCommands } from "@/handlers/hashtag-commands";
import { importInkText } from "@/loader/importer";
import { INK_DEV_API_HASHTAG_COMMANDS, INK_DEV_API_TEXT_REPLACES } from "@/vite/costants";
import type { InkHashtagCommandInfo, InkTextReplaceInfo } from "@/vite/info-types";
import { TextReplaces } from "@drincs/pixi-vn-json";

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
        ({ name, description }) => ({
            name,
            description,
        }),
    );

    const textReplaceInfo: InkTextReplaceInfo[] = TextReplaces.info().map(
        ({ name, description, type }) => ({
            name,
            description,
            type,
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
        void syncHandlerInfoToDevServer();

        import.meta.hot.on("ink-updated", async (inkText) => {
            await importInkText(inkText);
            void syncHandlerInfoToDevServer();
        });
    }
}
