import { Plugin } from "vite";
import { importInkText } from "../functions/importer";

/**
 * This function creates a Vite plugin that prevents Hot Module Replacement (HMR) for .ink files.
 * Instead of triggering HMR, it imports the .ink file using the `importInkText` function.
 * @returns A Vite plugin that prevents HMR for .ink files.
 */
export function noHmrInkPlugin(): Plugin {
    return {
        name: "no-hmr-ink",
        async handleHotUpdate({ file, read }) {
            if (file.endsWith(".ink")) {
                const fileText = await read();
                await importInkText(fileText);
                // Don't trigger HMR for .ink files, but still allow manual refresh to pick up changes
                return [];
            }
        },
    };
}
