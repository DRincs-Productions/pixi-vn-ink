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
    import type { PixiVNJson } from "@drincs/pixi-vn-json";

    /**
     * Array of raw `.ink` file contents matched by the `inkGlob` option of `vitePluginInk`.
     *
     * Import this in your entry file and pass it to `importInkText`:
     * ```ts title="main.ts"
     * import { importInkText } from "@drincs/pixi-vn-ink";
     * import inkTexts from "virtual:pixi-vn-ink";
     *
     * await importInkText(inkTexts);
     * ```
     */
    export const inkTexts: string[];

    /**
     * Array of pre-compiled Ink story objects (when `inkJsonOutputPattern` is configured in
     * `vitePluginInk`). Each entry is a {@link PixiVNJson} ready to be passed directly to
     * `importJson` — no extra HTTP fetch required.
     *
     * `undefined` when `inkJsonOutputPattern` is not set.
     *
     * `setupInkHmrListener` uses this automatically for the initial load; you only need to
     * import it directly if you are managing story loading yourself:
     * ```ts
     * import { importJson } from "@drincs/pixi-vn-ink";
     * import { inkJsons } from "virtual:pixi-vn-ink";
     *
     * if (inkJsons) await importJson(inkJsons);
     * ```
     */
    export const inkJsons: PixiVNJson[] | undefined;
}
