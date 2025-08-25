import { importInkText } from "../functions";

/**
 * Setup listener for ink updates via HMR
 */
export function setupInkHmrListener() {
    if (import.meta.hot) {
        import.meta.hot.on("ink-updated", (inkText) => {
            importInkText(inkText);
        });
    }
}
