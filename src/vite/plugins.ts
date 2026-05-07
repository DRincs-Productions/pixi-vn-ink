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
const DEFAULT_JSON_EXPORT_FILE_PATTERN = "[path][name].json";
const INK_EXPORT_PLACEHOLDER_PATTERN = /\[(name|ext|extname|file|path|dir)\]/g;

function normalizeSlashes(value: string): string {
    return value.replaceAll("\\", "/");
}

function getRootRelativeInkGlob(inkGlob: string): string {
    const normalized = normalizeSlashes(inkGlob.trim());
    if (!normalized) {
        throw new Error("vitePluginInk option `inkGlob` must not be empty.");
    }
    const withoutPrefix = normalized.replace(/^\.?\//, "");
    if (!withoutPrefix || withoutPrefix.startsWith("../")) {
        throw new Error(
            "vitePluginInk option `inkGlob` must be rooted in Vite `root` and cannot escape it.",
        );
    }
    return withoutPrefix;
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

function resolveInkJsonOutputPattern(
    root: string,
    publicDirectory: string,
    inkJsonPublicDir?: string,
    inkJsonOutputPattern?: string,
): string | undefined {
    if (!inkJsonPublicDir && !inkJsonOutputPattern) {
        return undefined;
    }
    if (inkJsonPublicDir && inkJsonOutputPattern) {
        throw new Error(
            "vitePluginInk options `inkJsonPublicDir` and `inkJsonOutputPattern` cannot be used together.",
        );
    }
    if (inkJsonOutputPattern) {
        const trimmedPattern = inkJsonOutputPattern.trim();
        if (!trimmedPattern) {
            throw new Error("vitePluginInk option `inkJsonOutputPattern` must not be empty.");
        }
        return path.isAbsolute(trimmedPattern)
            ? path.normalize(trimmedPattern)
            : path.resolve(root, trimmedPattern);
    }
    const outputDirectory = resolvePublicSubdirectory(publicDirectory, inkJsonPublicDir as string);
    return path.join(outputDirectory, DEFAULT_JSON_EXPORT_FILE_PATTERN);
}

function getOutputBaseDirectory(outputPattern: string): string {
    const firstPlaceholderIndex = outputPattern.search(INK_EXPORT_PLACEHOLDER_PATTERN);
    if (firstPlaceholderIndex === -1) {
        return path.dirname(outputPattern);
    }

    const staticPrefix = outputPattern
        .slice(0, firstPlaceholderIndex)
        .replace(/[\\/]+$/g, "");

    if (!staticPrefix) {
        throw new Error(
            "vitePluginInk option `inkJsonOutputPattern` must start with a static directory before placeholders.",
        );
    }
    return path.normalize(staticPrefix);
}

function isInsideDirectory(baseDirectory: string, targetPath: string): boolean {
    const relativePath = path.relative(baseDirectory, targetPath);
    return !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

function resolveInkJsonOutputPath(
    outputPattern: string,
    root: string,
    inputBaseDirectory: string,
    matchedFile: string,
): string {
    const relativeInputFile = normalizeSlashes(path.relative(inputBaseDirectory, matchedFile));
    const inputFile = path.posix.parse(relativeInputFile);

    const relativeRootFile = normalizeSlashes(path.relative(root, matchedFile));
    const rootDir = path.posix.dirname(relativeRootFile);
    const inputDir = path.posix.dirname(relativeInputFile);

    const tokenMap: Record<string, string> = {
        name: inputFile.name,
        ext: inputFile.ext.startsWith(".") ? inputFile.ext.slice(1) : inputFile.ext,
        extname: inputFile.ext,
        file: relativeInputFile,
        path: inputDir === "." ? "" : `${inputDir}/`,
        dir: rootDir === "." ? "" : `${rootDir}/`,
    };

    const rendered = normalizeSlashes(outputPattern).replace(
        INK_EXPORT_PLACEHOLDER_PATTERN,
        (_match, token: keyof typeof tokenMap) => tokenMap[token] ?? "",
    );
    return path.normalize(rendered);
}

function getManifestEntry(
    outputFile: string,
    root: string,
    publicDirectory: string,
): string {
    if (isInsideDirectory(publicDirectory, outputFile)) {
        const publicRelativePath = normalizeSlashes(path.relative(publicDirectory, outputFile));
        return `/${publicRelativePath}`;
    }
    if (isInsideDirectory(root, outputFile)) {
        return normalizeSlashes(path.relative(root, outputFile));
    }
    return normalizeSlashes(outputFile);
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
    /**
     * Output pattern for generated JSON files from matched `.ink` sources.
     *
     * When provided together with {@link VitePluginInkOptions.inkGlob}, each matched `.ink` file is
     * converted with `convertInkToJson` and written to the rendered destination.
     *
     * Placeholders:
     * - `[name]`: filename without extension
     * - `[ext]`: source extension without dot
     * - `[extname]`: source extension with dot
     * - `[file]`: source path relative to the `inkGlob` static base
     * - `[path]`: source directory relative to the `inkGlob` static base (with trailing slash)
     * - `[dir]`: source directory relative to Vite `root` (with trailing slash)
     *
     * Relative values are resolved from Vite `root`.
     *
     * @example "./public/ink-json/[path][name].json"
     * @example "/absolute/output/[dir][name].json"
     */
    inkJsonOutputPattern?: string;
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
    const { inkGlob, inkJsonPublicDir, inkJsonOutputPattern } = options ?? {};
    let resolvedConfig: ResolvedConfig | undefined;

    const exportInkJsonFiles = async () => {
        if (!resolvedConfig || !inkGlob) {
            return;
        }
        const outputPattern = resolveInkJsonOutputPattern(
            resolvedConfig.root,
            resolvedConfig.publicDir,
            inkJsonPublicDir,
            inkJsonOutputPattern,
        );
        if (!outputPattern) {
            return;
        }
        const rootRelativeInkGlob = getRootRelativeInkGlob(inkGlob);
        const outputDirectory = getOutputBaseDirectory(outputPattern);
        const inputBaseDirectory = getGlobBaseDirectory(resolvedConfig.root, rootRelativeInkGlob);
        if (!isInsideDirectory(resolvedConfig.root, inputBaseDirectory)) {
            throw new Error(
                "vitePluginInk option `inkGlob` must be rooted in Vite `root` and cannot escape it.",
            );
        }
        const matchedFiles = await glob(rootRelativeInkGlob, {
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
            const outputFile = resolveInkJsonOutputPath(
                outputPattern,
                resolvedConfig.root,
                inputBaseDirectory,
                matchedFile,
            );
            if (!isInsideDirectory(outputDirectory, outputFile)) {
                resolvedConfig.logger.error(
                    `[vite-plugin-ink] Output path "${outputFile}" escapes managed directory "${outputDirectory}".`,
                );
                continue;
            }
            generatedJsonFiles.add(outputFile);

            if (!converted) {
                await fs.rm(outputFile, { force: true });
                continue;
            }

            await fs.mkdir(path.dirname(outputFile), { recursive: true });
            await fs.writeFile(
                outputFile,
                `${JSON.stringify(converted, null, 2)}\n`,
                "utf-8",
            );

            manifestUrls.push(
                getManifestEntry(
                    outputFile,
                    resolvedConfig.root,
                    resolvedConfig.publicDir,
                ),
            );
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
        await fs.writeFile(
            manifestFile,
            `${JSON.stringify(manifestUrls, null, 2)}\n`,
            "utf-8",
        );
    };

    return {
        name: "vite-plugin-ink",
        enforce: "pre",

        configResolved(config) {
            resolvedConfig = config;
            const rootRelativeInkGlob = inkGlob ? getRootRelativeInkGlob(inkGlob) : undefined;
            if (rootRelativeInkGlob) {
                const inputBaseDirectory = getGlobBaseDirectory(config.root, rootRelativeInkGlob);
                if (!isInsideDirectory(config.root, inputBaseDirectory)) {
                    throw new Error(
                        "vitePluginInk option `inkGlob` must be rooted in Vite `root` and cannot escape it.",
                    );
                }
            }
            if ((inkJsonPublicDir || inkJsonOutputPattern) && !inkGlob) {
                throw new Error(
                    "vitePluginInk options `inkJsonPublicDir` and `inkJsonOutputPattern` require `inkGlob` to be set.",
                );
            }
            if (inkJsonPublicDir || inkJsonOutputPattern) {
                const outputPattern = resolveInkJsonOutputPattern(
                    config.root,
                    config.publicDir,
                    inkJsonPublicDir,
                    inkJsonOutputPattern,
                );
                if (!outputPattern) {
                    return;
                }
                const outputDirectory = getOutputBaseDirectory(outputPattern);
                if (path.resolve(outputDirectory) === path.resolve(config.root)) {
                    throw new Error(
                        "vitePluginInk option `inkJsonOutputPattern` must target a directory different from Vite `root`.",
                    );
                }
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
                    "[vite-plugin-ink] Failed to export Ink JSON files during server initialization or restart.",
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
                const rootRelativeInkGlob = getRootRelativeInkGlob(inkGlob);
                return [
                    `const modules = import.meta.glob(${JSON.stringify(`/${rootRelativeInkGlob}`)}, { eager: true, import: 'default' });`,
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
