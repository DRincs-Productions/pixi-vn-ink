/// <reference types="vite/client" />
import { importInkText, importJson } from "@/loader/importer";
import type { CharacterIdSource } from "@/loader/type";
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

/** Options for the Ink HMR listener helpers. */
export type InkHmrListenerOptions = {
    /**
     * Characters forwarded to {@link importInkText} when an update re-imports raw Ink text (the path
     * used without `inkJsonOutputPattern`), so `characterId: text` speakers resolve at reload time.
     */
    characters?: readonly CharacterIdSource[];
};

export async function handleInkUpdatedPayload(
    payload: string | InkUpdatedPayload,
    handlers?: InkUpdatedPayloadHandlers,
    options: InkHmrListenerOptions = {},
): Promise<void> {
    const resolvedHandlers: InkUpdatedPayloadHandlers = handlers ?? {
        importJson: async (data) => {
            await importJson(data);
        },
        importInkText: (inkText) => importInkText(inkText, { characters: options.characters }),
    };
    const inkJson =
        payload && typeof payload === "object" && "inkJson" in payload
            ? payload.inkJson
            : undefined;

    if (inkJson && inkJson.length > 0) {
        await resolvedHandlers.importJson(inkJson);
        return;
    }

    const inkText =
        payload && typeof payload === "object" && "inkText" in payload
            ? payload.inkText
            : typeof payload === "string"
              ? payload
              : undefined;

    if (typeof inkText === "string") {
        await resolvedHandlers.importInkText(inkText);
    }
}

/**
 * Sets up HMR listeners for live ink story reloading in the browser.
 *
 * Call this once in your app entry file.
 * If available in your `@drincs/pixi-vn` version, call `setupPixivnViteData()`
 * before this function; otherwise you can safely skip that step.
 * Handler registration (hashtag commands, text replaces, characters, labels)
 * is handled server-side by `vitePluginPixivn`'s `content` / `characters` /
 * `labels` options — no browser POSTs are needed.
 *
 * @param options.characters characters forwarded to {@link importInkText} on the raw-text reload
 * path (see {@link InkHmrListenerOptions})
 * @see https://pixi-vn.com/ink#vite-plugin
 * @example
 * ```ts title="main.ts"
 * // main.ts
 * import { setupInkHmrListener } from "@drincs/pixi-vn-ink/vite-listener";
 *
 * const pixivnViteListener = await import("@drincs/pixi-vn/vite-listener").catch((error) => {
 *   const message = error instanceof Error ? error.message : String(error);
 *   const code =
 *     typeof error === "object" && error !== null && "code" in error
 *       ? String((error as { code?: unknown }).code)
 *       : "";
 *   if (
 *     code === "ERR_MODULE_NOT_FOUND" ||
 *     code === "ERR_PACKAGE_PATH_NOT_EXPORTED" ||
 *     message.includes("@drincs/pixi-vn/vite-listener")
 *   ) return undefined;
 *   throw error;
 * });
 * await pixivnViteListener?.setupPixivnViteData?.();
 * await setupInkHmrListener();
 * ```
 */
export async function setupInkHmrListener(options: InkHmrListenerOptions = {}) {
    // Load the initial ink JSON unconditionally: this is needed in every mode, not just dev.
    // `import.meta.hot` is only defined while a Vite dev server is attached (never in a
    // production build or `vite preview`) — gating this import behind it meant a deployed build
    // never loaded any ink-derived content (labels, steps, ...) at all, since nothing else in a
    // typical app calls `importJson` for these files.
    if (inkJsons && inkJsons.length > 0) {
        await importJson(inkJsons);
    }

    if (import.meta.hot) {
        import.meta.hot.on("ink-updated", async (payload: string | InkUpdatedPayload) => {
            await handleInkUpdatedPayload(payload, undefined, options);
        });

        import.meta.hot.on("ink-error-cleared", () => {
            document.querySelectorAll("vite-error-overlay").forEach((el) => {
                (el as HTMLElement & { close(): void }).close();
            });
        });
    }
}
