import { convertInkToJson } from "@/loader/ink-to-pixivn";
import { InkCompiler } from "@drincs/pixi-vn-ink/parser";
import { ErrorType } from "inkjs/compiler/Parser/ErrorType";
import fs from "node:fs/promises";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import { glob } from "tinyglobby";

const VIRTUAL_MODULE_ID = "virtual:pixi-vn-ink";
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;
const JSON_MANIFEST_FILE_NAME = "manifest.json";

function normalizeSlashes(value: string): string {
    return value.replaceAll("\\", "/");
}

function getGlobBaseDirectory(root: string, pattern: string): string {
    const segments = normalizeSlashes(pattern).split("/");
    const staticSegments: string[] = [];
    for (const segment of segments) {
        if (segment === "." || segment === "") {
            continue;
        }
        if (/[*!?[\]{}()]/.test(segment)) {
            break;
        }
        staticSegments.push(segment);
    }
    return path.resolve(root, ...staticSegments);
}

function resolvePublicSubdirectory(publicDirectory: string, subdirectory: string): string {
    const trimmedSubdirectory = subdirectory.trim();
    if (!trimmedSubdirectory) {
        throw new Error("vitePluginInk option `inkJsonPublicDir` must not be empty.");
    }
    const outputDirectory = path.resolve(publicDirectory, trimmedSubdirectory);
    const relativeToPublic = path.relative(publicDirectory, outputDirectory);
    if (
        outputDirectory === publicDirectory ||
        relativeToPublic.startsWith("..") ||
        path.isAbsolute(relativeToPublic)
    ) {
        throw new Error(
            "vitePluginInk option `inkJsonPublicDir` must point to a subdirectory inside Vite `publicDir`.",
        );
    }
    return outputDirectory;
}

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
    /**
     * Subdirectory inside Vite's `publicDir` where matched `.ink` files are exported as `.json`.
     *
     * When provided together with {@link VitePluginInkOptions.inkGlob}, each matched `.ink` file is
     * converted with `convertInkToJson` and written into this subdirectory while preserving its
     * relative folder structure. A `manifest.json` file is also generated in the same folder to
     * simplify runtime bulk loading.
     *
     * The value must be a subdirectory name relative to `publicDir`, for example `ink-json`.
     *
     * @example "ink-json"
     */
    inkJsonPublicDir?: string;
}

/**
 * Creates a Vite plugin that:
 * - Prevents Hot Module Replacement (HMR) for `.ink` files and instead sends an `ink-updated`
 *   custom event to the client so that {@link setupInkHmrListener} can reload the story.
 * - Transforms `.ink` files so they can be imported as plain strings.
 * - Optionally generates a virtual module `virtual:pixi-vn-ink` (when {@link VitePluginInkOptions.inkGlob}
 *   is provided) that exports all matched ink file contents as a `string[]`, removing the need
 *   to write a manual glob-import helper.
 * - Optionally exports the same matched `.ink` files as `.json` into a subdirectory of `public`
 *   (when {@link VitePluginInkOptions.inkJsonPublicDir} is provided), together with a
 *   `manifest.json` file for bulk runtime loading with `importPixiVNJson`.
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
 *
 * @example
 * // vite.config.ts – generate JSON files in public/ink-json too
 * import { defineConfig } from "vite";
 * import { vitePluginInk } from "@drincs/pixi-vn-ink/vite";
 *
 * export default defineConfig({
 *   plugins: [
 *     vitePluginInk({
 *       inkGlob: "./ink/**\/*.ink",
 *       inkJsonPublicDir: "ink-json",
 *     }),
 *   ],
 * });
 *
 * @example
 * // Bulk-load the generated JSON files at runtime
 * import { importPixiVNJson } from "@drincs/pixi-vn-json/interpreter";
 *
 * const manifest = (await fetch("/ink-json/manifest.json").then((response) =>
 *   response.json(),
 * )) as string[];
 *
 * const stories = await Promise.all(
 *   manifest.map((url) => fetch(url).then((response) => response.json())),
 * );
 *
 * await Promise.all(stories.map((story) => importPixiVNJson(story)));
 */
export function vitePluginInk(options?: VitePluginInkOptions): Plugin {
    const { inkGlob, inkJsonPublicDir } = options ?? {};
    let resolvedConfig: ResolvedConfig | undefined;

    const exportInkJsonFiles = async () => {
        if (!resolvedConfig || !inkGlob || !inkJsonPublicDir) {
            return;
        }
        const outputDirectory = resolvePublicSubdirectory(resolvedConfig.publicDir, inkJsonPublicDir);
        const inputBaseDirectory = getGlobBaseDirectory(resolvedConfig.root, inkGlob);
        const matchedFiles = await glob(inkGlob, {
            absolute: true,
            cwd: resolvedConfig.root,
            onlyFiles: true,
        });
        const manifestUrls: string[] = [];
        const generatedJsonFiles = new Set<string>();

        await fs.mkdir(outputDirectory, { recursive: true });

        for (const matchedFile of matchedFiles) {
            const source = await fs.readFile(matchedFile, "utf-8");
            let converted: ReturnType<typeof convertInkToJson>;
            try {
                converted = convertInkToJson(source);
            } catch (error) {
                const normalizedError =
                    error instanceof Error ? error : new Error(String(error));
                resolvedConfig.logger.error(
                    `[vite-plugin-ink] Failed to convert "${matchedFile}" to JSON.`,
                    {
                        error: normalizedError,
                    },
                );
                continue;
            }
            const relativeInputFile = path.relative(inputBaseDirectory, matchedFile);
            const relativeJsonFile = relativeInputFile.replace(/\.ink$/i, ".json");
            const outputFile = path.join(outputDirectory, relativeJsonFile);
            generatedJsonFiles.add(outputFile);

            if (!converted) {
                await fs.rm(outputFile, { force: true });
                continue;
            }

            await fs.mkdir(path.dirname(outputFile), { recursive: true });
            await fs.writeFile(outputFile, `${JSON.stringify(converted, null, 2)}\n`, "utf-8");

            const publicRelativePath = normalizeSlashes(
                path.relative(resolvedConfig.publicDir, outputFile),
            );
            manifestUrls.push(`/${publicRelativePath}`);
        }

        const manifestFile = path.join(outputDirectory, JSON_MANIFEST_FILE_NAME);
        const existingJsonFiles = await glob("**/*.json", {
            absolute: true,
            cwd: outputDirectory,
            onlyFiles: true,
        });

        for (const existingJsonFile of existingJsonFiles) {
            if (
                path.basename(existingJsonFile) !== JSON_MANIFEST_FILE_NAME &&
                !generatedJsonFiles.has(existingJsonFile)
            ) {
                await fs.rm(existingJsonFile, { force: true });
            }
        }

        manifestUrls.sort((left, right) => left.localeCompare(right));
        await fs.writeFile(manifestFile, `${JSON.stringify(manifestUrls, null, 2)}\n`, "utf-8");
    };

    return {
        name: "vite-plugin-ink",
        enforce: "pre",

        configResolved(config) {
            resolvedConfig = config;
            if (inkJsonPublicDir && !inkGlob) {
                throw new Error(
                    "vitePluginInk option `inkJsonPublicDir` requires `inkGlob` to be set.",
                );
            }
            if (inkJsonPublicDir) {
                resolvePublicSubdirectory(config.publicDir, inkJsonPublicDir);
            }
        },

        async buildStart() {
            await exportInkJsonFiles();
        },

        configureServer() {
            void exportInkJsonFiles().catch((error) => {
                const normalizedError =
                    error instanceof Error ? error : new Error(String(error));
                resolvedConfig?.logger.error(
                    "[vite-plugin-ink] Failed to export Ink JSON files during server startup.",
                    {
                        error: normalizedError,
                    },
                );
            });
        },

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

                await exportInkJsonFiles();

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
        async transform(_code, id) {
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
