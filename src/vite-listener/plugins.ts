/// <reference types="vite/client" />
import { importInkText } from "@/loader/importer";

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
        import.meta.hot.on("ink-updated", (inkText) => {
            importInkText(inkText);
        });
    }
}
