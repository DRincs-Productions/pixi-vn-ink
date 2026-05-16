/**
 * Ambient module declaration for the virtual module `virtual:pixi-vn-ink`.
 *
 * Add a reference to this file in your project's type declaration file
 * (e.g. `vite-env.d.ts` or `env.d.ts`) to get full TypeScript support:
 *
 * ```ts
 * /// <reference types="@drincs/pixi-vn-ink/vite/client" />
 * ```
 */
declare module "virtual:pixi-vn-ink" {
    /**
     * Array of raw `.ink` file contents matched by the `inkGlob` option of `vitePluginInk`.
     *
     * Import this in your entry file and pass it to `importInkText`:
     * ```ts
     * import { importInkText } from "@drincs/pixi-vn-ink";
     * import inkTexts from "virtual:pixi-vn-ink";
     *
     * await importInkText(inkTexts);
     * ```
     */
    const inkTexts: string[];
    /**
     * Array of generated Ink JSON URLs (when `inkJsonOutputPattern` is configured in
     * `vitePluginInk`), suitable for bulk loading with `importJson`.
     */
    export const inkJsonManifest: string[];
    export default inkTexts;
}
