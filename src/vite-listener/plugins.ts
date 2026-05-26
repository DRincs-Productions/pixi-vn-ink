/// <reference types="vite/client" />
import { importInkText, importJson } from "@/loader/importer";
import type { PixiVNJson } from "@drincs/pixi-vn-json";
import { inkJsons } from "virtual:pixi-vn-ink";

type InkUpdatedPayload = {
    inkText?: string;
    inkJson?: PixiVNJson[];
};

type InkUpdatedPayloadHandlers = {
    importJson: (inkJson: PixiVNJson[]) => Promise<void>;
    importInkText: (inkText: string) => Promise<unknown>;
};

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
 * Sets up HMR listeners for live ink story reloading in the browser.
 *
 * Call this once in your app entry file, **after** `setupPixivnViteData()`.
 * Handler registration (hashtag commands, text replaces, characters, labels)
 * is handled server-side by `vitePluginPixivn`'s `content` / `characters` /
 * `labels` options — no browser POSTs are needed.
 *
 * @see https://pixi-vn.web.app/ink#vite-plugin
 * @example
 * ```ts title="main.ts"
 * // main.ts
 * import { setupPixivnViteData } from "@drincs/pixi-vn/vite-listener";
 * import { setupInkHmrListener } from "@drincs/pixi-vn-ink/vite-listener";
 *
 * await setupPixivnViteData();
 * await setupInkHmrListener();
 * ```
 */
export async function setupInkHmrListener() {
    if (import.meta.hot) {
        if (inkJsons && inkJsons.length > 0) {
            await importJson(inkJsons);
        }

        import.meta.hot.on("ink-updated", async (payload: string | InkUpdatedPayload) => {
            await handleInkUpdatedPayload(payload);
        });

        import.meta.hot.on("ink-error-cleared", () => {
            document.querySelectorAll("vite-error-overlay").forEach((el) => {
                (el as HTMLElement & { close(): void }).close();
            });
        });
    }
}
