import { InkCompiler } from "@drincs/pixi-vn-ink/parser";
import { ErrorType } from "inkjs/compiler/Parser/ErrorType";
import fs from "node:fs/promises";
import type { Plugin } from "vite";

const VIRTUAL_MODULE_ID = "virtual:pixi-vn-ink";
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

/**
 * Options for {@link vitePluginInk}.
 */
export interface VitePluginInkOptions {
    /**
     * Glob pattern specifying which `.ink` files to scan and load automatically.
     *
     * When provided, a virtual module `virtual:pixi-vn-ink` is generated and can be imported
     * anywhere in your app. It exports, as its default export, an array of strings (`string[]`)
     * containing the raw text of every matched `.ink` file.
     *
     * This eliminates the need to manually write a glob-import helper such as `getInkText`.
     *
     * The pattern follows the standard glob format used by
     * [Vite's `import.meta.glob`](https://vite.dev/guide/features#glob-import).
     *
     * @example "./ink/**\/*.ink"
     */
    inkGlob?: string;
}

/**
 * Creates a Vite plugin that:
 * - Prevents Hot Module Replacement (HMR) for `.ink` files and instead sends an `ink-updated`
 *   custom event to the client so that {@link setupInkHmrListener} can reload the story.
 * - Transforms `.ink` files so they can be imported as plain strings.
 * - Optionally generates a virtual module `virtual:pixi-vn-ink` (when {@link VitePluginInkOptions.inkGlob}
 *   is provided) that exports all matched ink file contents as a `string[]`, removing the need
 *   to write a manual glob-import helper.
 *
 * @param options - Optional plugin configuration.
 * @returns A Vite plugin.
 * @see https://pixi-vn.web.app/ink#vite-plugin
 * @example
 * // vite.config.ts – without inkGlob (manual loading)
 * import { defineConfig } from "vite";
 * import { vitePluginInk } from "@drincs/pixi-vn-ink/vite";
 *
 * export default defineConfig({
 *   plugins: [vitePluginInk()],
 * });
 *
 * @example
 * // vite.config.ts – with inkGlob (automatic loading via virtual module)
 * import { defineConfig } from "vite";
 * import { vitePluginInk } from "@drincs/pixi-vn-ink/vite";
 *
 * export default defineConfig({
 *   plugins: [vitePluginInk({ inkGlob: "./ink/**\/*.ink" })],
 * });
 *
 * // main.ts
 * import { importInkText } from "@drincs/pixi-vn-ink";
 * import { setupInkHmrListener } from "@drincs/pixi-vn-ink/vite-listener";
 * import inkTexts from "virtual:pixi-vn-ink";
 *
 * await importInkText(inkTexts);
 * setupInkHmrListener();
 */
export function vitePluginInk(options?: VitePluginInkOptions): Plugin {
    const { inkGlob } = options ?? {};

    return {
        name: "vite-plugin-ink",
        enforce: "pre",

        resolveId(id) {
            if (id === VIRTUAL_MODULE_ID) {
                return RESOLVED_VIRTUAL_MODULE_ID;
            }
        },

        load(id) {
            if (id === RESOLVED_VIRTUAL_MODULE_ID) {
                if (!inkGlob) {
                    return "export default [];";
                }
                return [
                    `const modules = import.meta.glob(${JSON.stringify(inkGlob)}, { eager: true, import: 'default' });`,
                    "export default Object.values(modules);",
                ].join("\n");
            }
        },

        async handleHotUpdate({ file, server, read }) {
            if (file.endsWith(".ink")) {
                // Leggiamo il contenuto modificato
                const source = await read();
                const { issues } = InkCompiler.compile(source);

                let error: undefined | string;

                // Logghiamo eventuali warning/errori al terminale
                issues.forEach(({ line, message, type }) => {
                    if (type === ErrorType.Warning) {
                        server.config.logger.warn(`${file}:${line} ${message}`);
                    } else {
                        // Se è un errore, blocchiamo
                        server.config.logger.error(`${file}:${line} ${message}`);
                        error = message;
                    }
                });

                // Mostra overlay per errori
                if (error) {
                    server.ws.send({
                        type: "error",
                        err: {
                            message: error,
                            stack: file,
                            plugin: "vite-plugin-ink",
                        },
                    });
                } else {
                    // close server.hmr.overlay
                    server.ws.send({
                        type: "error",
                        err: null as any,
                    });

                    server.ws.send({
                        type: "custom",
                        event: "ink-updated",
                        data: source,
                    });
                }

                // NON restituiamo nulla => Vite non fa reload automatico della pagina
                return [];
            }
        },
        async transform(code, id) {
            if (!id.endsWith(".ink")) return null;

            const source = await fs.readFile(id, "utf-8");

            const { issues } = InkCompiler.compile(source);

            // Se ci sono warning, li logghiamo ma NON blocchiamo la build
            issues.forEach(({ line, message, type }) => {
                if (type === ErrorType.Warning) {
                    this.warn(`${id}:${line} ${message}`);
                } else {
                    // Se è un errore, blocchiamo
                    this.error(`${id}:${line} ${message}`);
                }
            });

            // esporta source
            return {
                code: `export default ${JSON.stringify(source)};`,
                map: null,
            };

            // * Convert ink to PixiVNJson during build (disabled for now because not used the browser environment, so don't know the pixi-vn character set, etc.)
            // return {
            //     code: `import { convertInkToJson } from "@drincs/pixi-vn-ink"; export default convertInkToJson(${JSON.stringify(
            //         source
            //     )});`,
            //     map: null,
            // };
        },
    };
}
