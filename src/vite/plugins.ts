import { HashtagCommands } from "@/handlers/hashtag-commands";
import { convertInkToJson } from "@/loader/ink-to-pixivn";
import { InkCompiler } from "@/parser";
import type { InkValidationInfo } from "@/parser/types";
import { INK_DEV_API_HASHTAG_COMMANDS, INK_DEV_API_TEXT_REPLACES } from "@/vite/costants";
import { TextReplaces, type PixiVNJson } from "@drincs/pixi-vn-json";
import Ajv, { type ErrorObject, type ValidateFunction } from "ajv";
import { ErrorType } from "inkjs/compiler/Parser/ErrorType";
import fs from "node:fs/promises";
import type { IncomingMessage } from "node:http";
import path from "node:path";
import pc from "picocolors";
import { glob } from "tinyglobby";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { toJSONSchema, type ZodType } from "zod";
import type { InkHashtagCommandInfo, InkTextReplaceInfo } from "./info-types";

const PLUGIN_PREFIX = pc.cyan("(pixi-vn-ink)");

const VIRTUAL_MODULE_ID = "virtual:pixi-vn-ink";
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;
const JSON_MANIFEST_FILE_NAME = "manifest.json";
const INK_EXPORT_PLACEHOLDER_PATTERN = /\[(name|ext|extname|file|path|dir)\]/g;
const INK_EXTERNAL_LABELS_PROVIDER_ID = "ink";

type PixivnPluginApi = {
    contentLoaded?: Promise<void>;
    /** Characters registered by `vite-plugin-pixi-vn`, populated after {@link contentLoaded}. */
    characters?: readonly { id: string }[];
    onReload?: (cb: () => void) => void;
    setExternalLabels?: (providerId: string, labels: string[]) => void | Promise<void>;
    clearExternalLabels?: (providerId: string) => void | Promise<void>;
    /** All label ids known to `vite-plugin-pixi-vn` (from every provider), populated after {@link contentLoaded}. */
    labels?: readonly string[];
};

type PixivnPlugin = {
    name: string;
    api?: PixivnPluginApi;
};

function serializeValidation(validation: RegExp | ZodType | string): InkValidationInfo {
    if (typeof validation === "string") {
        return { type: "literal", value: validation };
    }
    if (validation instanceof RegExp) {
        return { type: "regexp", source: validation.source, flags: validation.flags };
    }
    try {
        return { type: "zod", schema: toJSONSchema(validation) as Record<string, unknown> };
    } catch {
        return { type: "literal", value: "" };
    }
}

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

function resolveInkJsonOutputPattern(
    root: string,
    inkJsonOutputPattern?: string,
): string | undefined {
    if (!inkJsonOutputPattern) {
        return undefined;
    }
    const trimmedPattern = inkJsonOutputPattern.trim();
    if (!trimmedPattern) {
        throw new Error("vitePluginInk option `inkJsonOutputPattern` must not be empty.");
    }
    return path.isAbsolute(trimmedPattern)
        ? path.normalize(trimmedPattern)
        : path.resolve(root, trimmedPattern);
}

function resolveInkJsonManifestPath(
    root: string,
    outputDirectory: string,
    inkJsonManifestPath?: string,
): string {
    if (!inkJsonManifestPath) {
        return path.join(outputDirectory, JSON_MANIFEST_FILE_NAME);
    }
    const trimmed = inkJsonManifestPath.trim();
    if (!trimmed) {
        throw new Error("vitePluginInk option `inkJsonManifestPath` must not be empty.");
    }
    return path.isAbsolute(trimmed) ? path.normalize(trimmed) : path.resolve(root, trimmed);
}

function getOutputBaseDirectory(outputPattern: string): string {
    const firstPlaceholderIndex = outputPattern.search(INK_EXPORT_PLACEHOLDER_PATTERN);
    if (firstPlaceholderIndex === -1) {
        return path.dirname(outputPattern);
    }

    const staticPrefix = outputPattern.slice(0, firstPlaceholderIndex).replace(/[\\/]+$/g, "");

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

function getManifestEntry(outputFile: string, root: string, publicDirectory: string): string {
    if (isInsideDirectory(publicDirectory, outputFile)) {
        const publicRelativePath = normalizeSlashes(path.relative(publicDirectory, outputFile));
        return `/${publicRelativePath}`;
    }
    if (isInsideDirectory(root, outputFile)) {
        return normalizeSlashes(path.relative(root, outputFile));
    }
    return normalizeSlashes(outputFile);
}

function logUnknownHashtagCommands(
    source: string,
    hashtagCommandsStore: InkHashtagCommandInfo[],
    logWarning: (message: string, line?: number) => void,
): void {
    const unknownCommands = InkCompiler.getUnknownHashtagCommands(source, hashtagCommandsStore);

    unknownCommands.forEach(({ command, line }) => {
        logWarning(
            `Unknown hashtag command "# ${command}": no registered handler matched this command.`,
            line,
        );
    });

    if (unknownCommands.length > 0) {
        logWarning(`Hashtag command metadata is available via ${INK_DEV_API_HASHTAG_COMMANDS}.`);
    }
}

function logUnknownDivertTargets(
    source: string,
    knownLabels: readonly string[],
    logWarning: (message: string, line?: number) => void,
): void {
    if (knownLabels.length === 0) return;
    const unknownTargets = InkCompiler.getUnknownDivertTargets(source, knownLabels);
    unknownTargets.forEach(({ target, line }) => {
        logWarning(`Divert target "${target}" not found in any known label source.`, line);
    });
}

/**
 * Compiled Ajv validators, cached by the `$schema` URL they were fetched from — the URL embeds
 * the `@drincs/pixi-vn-json` version (e.g. `.../schemas/1.13.10/schema.json`), so every exported
 * file within a build shares one cached fetch+compile instead of re-fetching per file/per edit.
 * `undefined` means the fetch or compile failed (already warned once) and is cached too, so a
 * broken/offline schema URL doesn't retry (and re-warn) on every keystroke.
 * One instance lives per {@link vitePluginInk} call (passed in), not at module scope, so
 * separate plugin instances (and tests) don't share a fetch cache.
 */
type SchemaValidatorCache = Map<string, Promise<ValidateFunction | undefined>>;

async function getSchemaValidator(
    schemaUrl: string,
    cache: SchemaValidatorCache,
    logWarning: (message: string) => void,
): Promise<ValidateFunction | undefined> {
    let cached = cache.get(schemaUrl);
    if (!cached) {
        cached = (async () => {
            try {
                const response = await fetch(schemaUrl);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} ${response.statusText}`);
                }
                const schema = await response.json();
                const ajv = new Ajv({ strict: false, allErrors: true });
                return ajv.compile(schema);
            } catch (error) {
                logWarning(
                    `Could not load/compile JSON schema from "${schemaUrl}" (${
                        error instanceof Error ? error.message : String(error)
                    }). Skipping schema validation.`,
                );
                return undefined;
            }
        })();
        cache.set(schemaUrl, cached);
    }
    return cached;
}

/**
 * Walks a JSON Pointer (Ajv's `instancePath`, e.g. `/labels/talk_alice/2/operations/0/value`)
 * down from `root`, remembering the `$origin` of the deepest node that has one. Operations
 * converted from a `#` hashtag command carry `$origin` (the raw ink source line) — so a schema
 * error nested inside one (e.g. a bad `value`) still resolves back to the line that produced it,
 * even though the error itself points at a plain field with no `$origin` of its own.
 */
function findNearestOrigin(root: unknown, instancePath: string): string | undefined {
    const segments = instancePath
        .split("/")
        .filter(Boolean)
        .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));

    let node: unknown = root;
    let nearestOrigin: string | undefined;
    const captureOrigin = (candidate: unknown) => {
        if (
            candidate &&
            typeof candidate === "object" &&
            typeof (candidate as Record<string, unknown>).$origin === "string"
        ) {
            nearestOrigin = (candidate as Record<string, unknown>).$origin as string;
        }
    };

    captureOrigin(node);
    for (const segment of segments) {
        if (node === null || typeof node !== "object") break;
        node = (node as Record<string, unknown>)[segment];
        captureOrigin(node);
    }
    return nearestOrigin;
}

/**
 * Ajv's `anyOf`/`oneOf` reports one error per *rejected* branch, plus a summary error for the
 * union itself — for a schema this recursive (a switch's `condition`/`then`/`else` all resolve
 * through the same wide unions, several levels deep), that fans out into dozens of "must have
 * required property X" complaints about branches that were never the intended shape to begin
 * with (e.g. checking a comparison's `rightValue` against the arithmetic-operation branch). None
 * of that is actionable, so it's trimmed down to what the failing *value* is actually missing:
 *
 * 1. Keep only "leaf" errors — drop any error whose `instancePath` is an ancestor of another
 *    error's, since the deeper one is strictly more specific about what's actually wrong.
 * 2. At each remaining path, prefer a concrete reason (`type`, `const`, `enum`, ...) over the
 *    bare "must match a schema in anyOf"/"oneOf" summary, when one is available.
 * 3. Collapse repeats of the same complaint on the same field across sibling branches (e.g. one
 *    per switch case) into a single warning.
 */
function simplifySchemaErrors(errors: ErrorObject[]): ErrorObject[] {
    const instancePaths = errors.map((error) => error.instancePath);
    const isAncestorOfAnother = (path: string) =>
        instancePaths.some((other) => other !== path && other.startsWith(`${path}/`));
    const leaves = errors.filter((error) => !isAncestorOfAnother(error.instancePath));

    const byPath = new Map<string, ErrorObject[]>();
    for (const error of leaves) {
        const group = byPath.get(error.instancePath) ?? [];
        group.push(error);
        byPath.set(error.instancePath, group);
    }

    const specificOverUnionWrapper: ErrorObject[] = [];
    for (const group of byPath.values()) {
        const specific = group.filter(
            (error) => error.keyword !== "anyOf" && error.keyword !== "oneOf",
        );
        specificOverUnionWrapper.push(...(specific.length > 0 ? specific : group));
    }

    const seen = new Set<string>();
    return specificOverUnionWrapper.filter((error) => {
        const field = error.instancePath.split("/").pop() ?? error.instancePath;
        const key = `${field}|${error.message}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Validates an exported `PixiVNJson` payload against the JSON Schema referenced by its own
 * `$schema` field, and reports any mismatch as a warning (never blocks export/build — a schema
 * drift shouldn't be fatal). Mismatches are expected to mostly land inside `operations` (e.g. a
 * custom hashtag-command handler returning a slightly malformed operation), so each warning
 * includes the nearest `$origin` — the original `# ...` ink source line — to make it findable.
 */
async function validatePixiVNJsonAgainstSchema(
    data: PixiVNJson,
    fileLabel: string,
    cache: SchemaValidatorCache,
    logWarning: (message: string) => void,
): Promise<void> {
    const schemaUrl = data.$schema;
    if (!schemaUrl) return;

    const validate = await getSchemaValidator(schemaUrl, cache, logWarning);
    if (!validate) return;

    const valid = validate(data);
    if (valid) return;

    for (const error of simplifySchemaErrors(validate.errors ?? [])) {
        const origin = findNearestOrigin(data, error.instancePath);
        const location = error.instancePath || "(root)";
        const originSuffix = origin ? ` — from ink source: "${origin}"` : "";
        logWarning(
            `${fileLabel}: schema validation failed at "${location}": ${error.message ?? "invalid value"}${originSuffix}`,
        );
    }
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
     * The plugin resolves it from Vite `root` and internally normalizes it to a root-absolute
     * pattern for the generated virtual module.
     *
     * @example "./ink/**\/*.ink"
     * @example "/src/stories/**\/*.ink"
     */
    inkGlob?: string;
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
    /**
     * Custom path (including filename) for the manifest file generated alongside the exported JSON
     * files.
     *
     * When {@link VitePluginInkOptions.inkJsonOutputPattern} is set, a `manifest.json` file listing
     * all exported JSON URLs is written into the output base directory by default. Use this option
     * to override the manifest file location and/or its name.
     *
     * Relative values are resolved from Vite `root`.
     *
     * @example "./public/ink-json/index.json"
     * @example "./generated/manifest.json"
     */
    inkJsonManifestPath?: string;
    /**
     * Character ids to recognise when splitting `characterId: text` speakers in `.ink` files.
     * Characters from `vite-plugin-pixi-vn` (its `api.characters`) are picked up automatically;
     * use this to supply ids explicitly when it is not present.
     *
     * @example ["alice", "james"]
     */
    characters?: readonly string[];
}

function readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk: Buffer) => {
            body += chunk.toString();
        });
        req.on("end", () => resolve(body));
        req.on("error", reject);
    });
}

/**
 * Creates a Vite plugin that:
 * - Prevents Hot Module Replacement (HMR) for `.ink` files and instead sends an `ink-updated`
 *   custom event to the client so that {@link setupInkHmrListener} can reload the story.
 * - Transforms `.ink` files so they can be imported as plain strings.
 * - Optionally generates a virtual module `virtual:pixi-vn-ink` (when {@link VitePluginInkOptions.inkGlob}
 *   is provided) that exports all matched ink file contents as a `string[]`, removing the need
 *   to write a manual glob-import helper.
 * - Optionally exports the same matched `.ink` files as `.json` to a configurable location
 *   (when {@link VitePluginInkOptions.inkJsonOutputPattern} is provided), together with a
 *   `manifest.json` file for bulk runtime loading with `importPixiVNJson`.
 *
 * @param options - Optional plugin configuration.
 * @returns A Vite plugin.
 * @see https://pixi-vn.com/ink#vite-plugin
 * @example
 * ```ts title="vite.config.ts"
 * // vite.config.ts – without inkGlob (manual loading)
 * import { defineConfig } from "vite";
 * import { vitePluginInk } from "@drincs/pixi-vn-ink/vite";
 *
 * export default defineConfig({
 *   plugins: [vitePluginInk()],
 * });
 * ```
 *
 * @example
 * ```ts title="vite.config.ts"
 * // vite.config.ts – with inkGlob (automatic loading via virtual module)
 * import { defineConfig } from "vite";
 * import { vitePluginInk } from "@drincs/pixi-vn-ink/vite";
 *
 * export default defineConfig({
 *   plugins: [vitePluginInk({ inkGlob: "./ink/**\/*.ink" })],
 * });
 * ```
 *
 * ```ts title="main.ts"
 * // main.ts
 * import { importInkText } from "@drincs/pixi-vn-ink";
 * import { setupInkHmrListener } from "@drincs/pixi-vn-ink/vite-listener";
 * import inkTexts from "virtual:pixi-vn-ink";
 *
 * await importInkText(inkTexts);
 * setupInkHmrListener();
 * ```
 *
 * @example
 * ```ts title="vite.config.ts"
 * // vite.config.ts – generate JSON files in public/ink-json too
 * import { defineConfig } from "vite";
 * import { vitePluginInk } from "@drincs/pixi-vn-ink/vite";
 *
 * export default defineConfig({
 *   plugins: [
 *     vitePluginInk({
 *       inkGlob: "./ink/**\/*.ink",
 *       inkJsonOutputPattern: "./public/ink-json/[path][name].json",
 *     }),
 *   ],
 * });
 * ```
 *
 * @example
 * ```ts title="main.ts"
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
 * ```
 */
export function vitePluginInk(options?: VitePluginInkOptions): Plugin {
    const { inkGlob, inkJsonOutputPattern, inkJsonManifestPath, characters } = options ?? {};
    const hasInkJsonManifestMode = Boolean(inkJsonOutputPattern);
    let resolvedConfig: ResolvedConfig | undefined;
    let hashtagCommandsStore: InkHashtagCommandInfo[] = [];
    let textReplacesStore: InkTextReplaceInfo[] = [];
    let virtualInkJsonData: PixiVNJson[] | undefined;
    let managedInkJsonOutputDirectory: string | undefined;
    let managedInkJsonManifestPath: string | undefined;
    let externalInkLabelIdsStore: string[] = [];
    let lastSyncedExternalLabelHash: string | undefined;
    let devServer: ViteDevServer | undefined;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    const schemaValidatorCache: SchemaValidatorCache = new Map();

    type SsrHandlerInfo = {
        name: string;
        description?: string;
        validation: RegExp | ZodType | string;
    };
    type SsrReplaceInfo = SsrHandlerInfo & { type?: "before-translation" | "after-translation" };

    const syncStores = async () => {
        // `@drincs/pixi-vn-ink` is never added to `ssr.noExternal` by this plugin (or by
        // `vite-plugin-pixi-vn` / `vite-plugin-nqtr`), so content files always import it via
        // Node's native module resolution — the exact same resolution this plugin's own
        // top-level `HashtagCommands`/`TextReplaces` imports go through. Re-fetching it via
        // `devServer.ssrLoadModule` instead resolves a *different*, always-empty-of-custom-
        // registrations instance (Vite's SSR loader does not guarantee identity with a plain
        // Node import for an externalized dependency — in practice it lands on the separate CJS
        // build). That mismatch is invisible for `HashtagCommands` (its 36+ built-in
        // `.addMapper()` translators still show up, masking the missing custom `.add()` ones)
        // but made `TextReplaces` — which has no built-in entries at all — always report 0,
        // even when text replaces were registered and used correctly for JSON export.
        const hashtagInfo: SsrHandlerInfo[] = HashtagCommands.info();
        const textReplaceInfo: SsrReplaceInfo[] = TextReplaces.info() as SsrReplaceInfo[];

        hashtagCommandsStore = hashtagInfo.map(({ name, description, validation }) => ({
            name,
            description,
            validation: serializeValidation(validation),
        }));
        textReplacesStore = textReplaceInfo.map(({ name, description, validation, type }) => ({
            name,
            description,
            validation: serializeValidation(validation),
            type,
        }));
    };

    const getPixivnPlugin = (plugins?: readonly Plugin[]): PixivnPlugin | undefined =>
        plugins?.find((p) => p.name === "vite-plugin-pixi-vn") as PixivnPlugin | undefined;

    /**
     * `vite-plugin-nqtr` (from `@drincs/nqtr/vite`), when present, exposes a `contentLoaded`
     * promise just like `vite-plugin-pixi-vn`. Content files often read NQTR's generated id
     * arrays/enums (e.g. to build `createNqtrHandler` validators), so JSON export must not run
     * until both plugins have finished writing their generated files — not just pixi-vn's.
     */
    const getContentLoadedPromises = (plugins?: readonly Plugin[]): Promise<unknown>[] => {
        const nqtrPlugin = plugins?.find((p) => p.name === "vite-plugin-nqtr") as
            | (Plugin & { api?: { contentLoaded?: Promise<void> } })
            | undefined;
        return [
            getPixivnPlugin(plugins)?.api?.contentLoaded,
            nqtrPlugin?.api?.contentLoaded,
        ].filter((p): p is Promise<void> => Boolean(p));
    };

    const syncExternalLabelsToPixivn = async (pixivnPlugin: PixivnPlugin | undefined) => {
        const api = pixivnPlugin?.api;
        if (!api) return;

        const labels = externalInkLabelIdsStore;
        const labelHash = JSON.stringify(labels);
        if (labelHash === lastSyncedExternalLabelHash) return;

        try {
            if (labels.length === 0 && api.clearExternalLabels) {
                await api.clearExternalLabels(INK_EXTERNAL_LABELS_PROVIDER_ID);
            } else if (api.setExternalLabels) {
                await api.setExternalLabels(INK_EXTERNAL_LABELS_PROVIDER_ID, labels);
            } else {
                return;
            }
            lastSyncedExternalLabelHash = labelHash;
        } catch (error) {
            const normalizedError = error instanceof Error ? error : new Error(String(error));
            resolvedConfig?.logger.error(
                `${PLUGIN_PREFIX} Failed to sync Ink labels with vite-plugin-pixi-vn.`,
                { error: normalizedError, timestamp: true },
            );
        }
    };

    const isManagedInkJsonFile = (targetPath: string): boolean => {
        if (!hasInkJsonManifestMode || !managedInkJsonOutputDirectory) {
            return false;
        }
        const normalizedTargetPath = path.resolve(targetPath);
        if (managedInkJsonManifestPath && normalizedTargetPath === managedInkJsonManifestPath) {
            return true;
        }
        return isInsideDirectory(managedInkJsonOutputDirectory, normalizedTargetPath);
    };

    const scheduleReexport = () => {
        if (debounceTimer !== undefined) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            debounceTimer = undefined;
            void exportInkJsonFiles()
                .then(async () => {
                    await syncExternalLabelsToPixivn(getPixivnPlugin(devServer?.config.plugins));
                    const mod = devServer?.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
                    if (mod) devServer?.moduleGraph.invalidateModule(mod);
                    devServer?.ws.send({
                        type: "custom",
                        event: "ink-updated",
                        data: {
                            inkJson: hasInkJsonManifestMode
                                ? (virtualInkJsonData ?? [])
                                : undefined,
                        },
                    });
                })
                .catch((error) => {
                    const normalizedError =
                        error instanceof Error ? error : new Error(String(error));
                    resolvedConfig?.logger.error(
                        `${PLUGIN_PREFIX} Failed to re-export Ink JSON files after characters update.`,
                        { error: normalizedError, timestamp: true },
                    );
                });
        }, 150);
    };

    /**
     * Computes the current set of Ink-derived label ids without writing any JSON files to disk
     * and without waiting for `vite-plugin-pixi-vn` (or `vite-plugin-nqtr`)'s `contentLoaded`.
     *
     * `vite-plugin-pixi-vn` can take a while to resolve `contentLoaded` during `vite build`
     * (it spins up a whole secondary Vite server just to load content files via SSR), and a
     * build-time type-checker (e.g. `vite-plugin-checker`) can run its one-shot check well
     * before that resolves — failing (and, in practice, aborting the whole build) on a label
     * that `syncExternalLabelsToPixivn` was about to register a moment later. Since label ids
     * are structural (derived from knot/stitch/choice names) and don't depend on character
     * data, they can be resolved eagerly here and synced immediately, so `vite-plugin-pixi-vn`
     * already knows about every Ink label by the time anything else has a chance to check
     * against it. The full, character-aware conversion (and JSON export) still only runs after
     * `contentLoaded`, exactly as before.
     */
    const computeInkLabelIdsFast = async (): Promise<string[]> => {
        if (!resolvedConfig || !inkGlob) return [];
        const rootRelativeInkGlob = getRootRelativeInkGlob(inkGlob);
        const matchedFiles = await glob(rootRelativeInkGlob, {
            absolute: true,
            cwd: resolvedConfig.root,
            onlyFiles: true,
        });
        const allLabelIds: string[] = [];
        for (const matchedFile of matchedFiles) {
            try {
                const source = await fs.readFile(matchedFile, "utf-8");
                const converted = convertInkToJson(source, { characters: characters ?? [] });
                if (converted) allLabelIds.push(...Object.keys(converted.labels ?? {}));
            } catch {
                // Ignore parse errors here; the full export pass (after `contentLoaded`) already
                // reports them properly via `resolvedConfig.logger.error`.
            }
        }
        return Array.from(new Set(allLabelIds)).sort((left, right) => left.localeCompare(right));
    };

    const exportInkJsonFiles = async () => {
        if (!resolvedConfig || !inkGlob) {
            virtualInkJsonData = undefined;
            externalInkLabelIdsStore = [];
            return;
        }
        const outputPattern = resolveInkJsonOutputPattern(
            resolvedConfig.root,
            inkJsonOutputPattern,
        );
        if (!outputPattern) {
            virtualInkJsonData = undefined;
            externalInkLabelIdsStore = [];
            managedInkJsonOutputDirectory = undefined;
            managedInkJsonManifestPath = undefined;
            return;
        }

        const rootRelativeInkGlob = getRootRelativeInkGlob(inkGlob);
        const outputDirectory = getOutputBaseDirectory(outputPattern);
        managedInkJsonOutputDirectory = path.resolve(outputDirectory);
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
        const localJsonData: PixiVNJson[] = [];
        const generatedJsonFiles = new Set<string>();

        // Character ids known at conversion time: the `characters` option plus those exposed by
        // `vite-plugin-pixi-vn` via `api.characters`.
        const pixivnCharacters = getPixivnPlugin(resolvedConfig.plugins)?.api?.characters ?? [];
        const knownCharacters: (string | { id: string })[] = [
            ...(characters ?? []),
            ...pixivnCharacters,
        ];

        await fs.mkdir(outputDirectory, { recursive: true });

        const sourceByFile = new Map<string, string>();

        for (const matchedFile of matchedFiles) {
            const source = await fs.readFile(matchedFile, "utf-8");
            sourceByFile.set(matchedFile, source);
            let converted: ReturnType<typeof convertInkToJson>;
            try {
                converted = convertInkToJson(source, { characters: knownCharacters });
            } catch (error) {
                const normalizedError = error instanceof Error ? error : new Error(String(error));
                resolvedConfig.logger.error(
                    `${PLUGIN_PREFIX} Failed to convert "${matchedFile}" to JSON.`,
                    { error: normalizedError, timestamp: true },
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
                    `${PLUGIN_PREFIX} Output path "${outputFile}" escapes managed directory "${outputDirectory}".`,
                    { timestamp: true },
                );
                continue;
            }
            generatedJsonFiles.add(outputFile);

            if (!converted) {
                await fs.rm(outputFile, { force: true });
                continue;
            }

            localJsonData.push(converted);
            await fs.mkdir(path.dirname(outputFile), { recursive: true });
            await fs.writeFile(outputFile, `${JSON.stringify(converted, null, 2)}\n`, "utf-8");

            manifestUrls.push(
                getManifestEntry(outputFile, resolvedConfig.root, resolvedConfig.publicDir),
            );

            await validatePixiVNJsonAgainstSchema(
                converted,
                matchedFile,
                schemaValidatorCache,
                (message) =>
                    resolvedConfig!.logger.warn(`${PLUGIN_PREFIX} ${message}`, {
                        timestamp: true,
                    }),
            );
        }

        const manifestFile = resolveInkJsonManifestPath(
            resolvedConfig.root,
            outputDirectory,
            inkJsonManifestPath,
        );
        managedInkJsonManifestPath = path.resolve(manifestFile);
        const existingJsonFiles = await glob("**/*.json", {
            absolute: true,
            cwd: outputDirectory,
            onlyFiles: true,
        });

        for (const existingJsonFile of existingJsonFiles) {
            if (
                path.resolve(existingJsonFile) !== path.resolve(manifestFile) &&
                !generatedJsonFiles.has(existingJsonFile)
            ) {
                await fs.rm(existingJsonFile, { force: true });
            }
        }

        manifestUrls.sort((left, right) => left.localeCompare(right));
        virtualInkJsonData = localJsonData;
        const allLabelIds = localJsonData.flatMap((json) => Object.keys(json.labels ?? {}));
        externalInkLabelIdsStore = Array.from(new Set(allLabelIds)).sort((left, right) =>
            left.localeCompare(right),
        );
        const totalLabels = allLabelIds.length;

        // Surface unknown hashtag commands / divert targets at export time (dev-server startup,
        // every rebuild, and `vite build`) — not just on the next HMR edit of that specific file.
        // Without this, a typo like `# navigat ...` only ever gets reported once the file is
        // saved again; a fresh `npm run dev` (or CI build) would stay silent about it.
        const pixivnLabelsForExport = getPixivnPlugin(resolvedConfig.plugins)?.api?.labels ?? [];
        const knownLabelsForExport = [...externalInkLabelIdsStore, ...pixivnLabelsForExport];
        for (const [matchedFile, source] of sourceByFile) {
            logUnknownHashtagCommands(source, hashtagCommandsStore, (message, line) =>
                resolvedConfig!.logger.warn(
                    `${line !== undefined ? `${matchedFile}:${line}` : matchedFile}: ${message}`,
                    { timestamp: true },
                ),
            );
            logUnknownDivertTargets(source, knownLabelsForExport, (message, line) =>
                resolvedConfig!.logger.warn(
                    `${line !== undefined ? `${matchedFile}:${line}` : matchedFile}: ${message}`,
                    { timestamp: true },
                ),
            );
        }

        resolvedConfig.logger.info(
            `${PLUGIN_PREFIX} ${pc.dim(`${matchedFiles.length} file(s) exported: ${totalLabels} label(s), ${hashtagCommandsStore.length} hashtag-command(s), ${textReplacesStore.length} text-replace(s)`)}`,
            { timestamp: true },
        );
        await fs.mkdir(path.dirname(manifestFile), { recursive: true });
        await fs.writeFile(manifestFile, `${JSON.stringify(manifestUrls, null, 2)}\n`, "utf-8");
    };

    return {
        name: "vite-plugin-ink",
        enforce: "pre",

        configResolved(config) {
            resolvedConfig = config;
            managedInkJsonOutputDirectory = undefined;
            managedInkJsonManifestPath = undefined;
            const rootRelativeInkGlob = inkGlob ? getRootRelativeInkGlob(inkGlob) : undefined;
            if (rootRelativeInkGlob) {
                const inputBaseDirectory = getGlobBaseDirectory(config.root, rootRelativeInkGlob);
                if (!isInsideDirectory(config.root, inputBaseDirectory)) {
                    throw new Error(
                        "vitePluginInk option `inkGlob` must be rooted in Vite `root` and cannot escape it.",
                    );
                }
            }
            if (inkJsonOutputPattern && !inkGlob) {
                throw new Error(
                    "vitePluginInk option `inkJsonOutputPattern` requires `inkGlob` to be set.",
                );
            }
            if (inkJsonOutputPattern) {
                const outputPattern = resolveInkJsonOutputPattern(
                    config.root,
                    inkJsonOutputPattern,
                );
                if (!outputPattern) {
                    return;
                }
                const outputDirectory = getOutputBaseDirectory(outputPattern);
                managedInkJsonOutputDirectory = path.resolve(outputDirectory);
                managedInkJsonManifestPath = path.resolve(
                    resolveInkJsonManifestPath(config.root, outputDirectory, inkJsonManifestPath),
                );
                if (path.resolve(outputDirectory) === path.resolve(config.root)) {
                    throw new Error(
                        "vitePluginInk option `inkJsonOutputPattern` must target a directory different from Vite `root`.",
                    );
                }
            }
        },

        async buildStart() {
            const pixivnPlugin = getPixivnPlugin(resolvedConfig?.plugins);

            externalInkLabelIdsStore = await computeInkLabelIdsFast();
            await syncExternalLabelsToPixivn(pixivnPlugin);

            await Promise.all(getContentLoadedPromises(resolvedConfig?.plugins));
            await syncStores();
            await exportInkJsonFiles();
            await syncExternalLabelsToPixivn(pixivnPlugin);
        },

        configureServer(server) {
            devServer = server;
            server.middlewares.use(async (req, res, next) => {
                const url = req.url;
                const method = req.method;

                if (url === INK_DEV_API_HASHTAG_COMMANDS) {
                    if (method === "GET") {
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify(hashtagCommandsStore));
                        return;
                    }
                    if (method === "POST") {
                        try {
                            const body = await readBody(req);
                            hashtagCommandsStore = JSON.parse(body) as InkHashtagCommandInfo[];
                            res.statusCode = 204;
                            res.end();
                        } catch (error) {
                            resolvedConfig?.logger.warn(
                                `${PLUGIN_PREFIX} Invalid JSON body for POST ${INK_DEV_API_HASHTAG_COMMANDS}: ${String(error)}`,
                                { timestamp: true },
                            );
                            res.statusCode = 400;
                            res.end();
                        }
                        return;
                    }
                }

                if (url === INK_DEV_API_TEXT_REPLACES) {
                    if (method === "GET") {
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify(textReplacesStore));
                        return;
                    }
                    if (method === "POST") {
                        try {
                            const body = await readBody(req);
                            textReplacesStore = JSON.parse(body) as InkTextReplaceInfo[];
                            res.statusCode = 204;
                            res.end();
                        } catch (error) {
                            resolvedConfig?.logger.warn(
                                `${PLUGIN_PREFIX} Invalid JSON body for POST ${INK_DEV_API_TEXT_REPLACES}: ${String(error)}`,
                                { timestamp: true },
                            );
                            res.statusCode = 400;
                            res.end();
                        }
                        return;
                    }
                }

                next();
            });

            const pixivnPlugin = getPixivnPlugin(server.config.plugins);

            void Promise.all(getContentLoadedPromises(server.config.plugins))
                .then(async () => {
                    await syncStores();
                    await exportInkJsonFiles();
                    await syncExternalLabelsToPixivn(pixivnPlugin);
                })
                .catch((error) => {
                    const normalizedError =
                        error instanceof Error ? error : new Error(String(error));
                    resolvedConfig?.logger.error(
                        `${PLUGIN_PREFIX} Failed to export Ink JSON files during server initialization or restart.`,
                        { error: normalizedError, timestamp: true },
                    );
                });

            const onReload = pixivnPlugin?.api?.onReload;
            if (onReload)
                onReload(() => {
                    void syncStores().then(() => scheduleReexport());
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
                    return ["export const inkJsons = undefined;", "export default [];"].join("\n");
                }
                const rootRelativeInkGlob = getRootRelativeInkGlob(inkGlob);
                return [
                    `const modules = import.meta.glob(${JSON.stringify(`/${rootRelativeInkGlob}`)}, { eager: true, import: 'default' });`,
                    `export const inkJsons = ${JSON.stringify(
                        hasInkJsonManifestMode ? (virtualInkJsonData ?? []) : undefined,
                    )};`,
                    "export default Object.values(modules);",
                ].join("\n");
            }
        },

        hotUpdate: {
            // Run after Vite's importGlobPlugin so we can suppress the virtual-module
            // reload it would otherwise add when a new .ink file is created.
            order: "post",
            async handler({ type, file, server, read }) {
                if (file.endsWith(".ink")) {
                    if (type !== "delete") {
                        const source = await read();
                        const { issues } = InkCompiler.compile(source);

                        let error: undefined | string;

                        issues.forEach(({ line, message, type: issueType }) => {
                            if (issueType === ErrorType.Warning) {
                                server.config.logger.warn(`${file}:${line} ${message}`, {
                                    timestamp: true,
                                });
                            } else {
                                server.config.logger.error(`${file}:${line} ${message}`, {
                                    timestamp: true,
                                });
                                error = message;
                            }
                        });
                        logUnknownHashtagCommands(source, hashtagCommandsStore, (message, line) =>
                            server.config.logger.warn(
                                `${line !== undefined ? `${file}:${line}` : file}: ${message}`,
                                { timestamp: true },
                            ),
                        );
                        const pixivnLabelsHU =
                            getPixivnPlugin(server.config.plugins)?.api?.labels ?? [];
                        logUnknownDivertTargets(
                            source,
                            [...externalInkLabelIdsStore, ...pixivnLabelsHU],
                            (message, line) =>
                                server.config.logger.warn(
                                    `${line !== undefined ? `${file}:${line}` : file}: ${message}`,
                                    { timestamp: true },
                                ),
                        );

                        await exportInkJsonFiles();
                        await syncExternalLabelsToPixivn(getPixivnPlugin(server.config.plugins));

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
                            server.ws.send({
                                type: "custom",
                                event: "ink-error-cleared",
                                data: {},
                            });
                            server.ws.send({
                                type: "custom",
                                event: "ink-updated",
                                data: {
                                    inkText: source,
                                    inkJson: hasInkJsonManifestMode
                                        ? (virtualInkJsonData ?? [])
                                        : undefined,
                                },
                            });
                        }
                    } else {
                        await exportInkJsonFiles();
                        await syncExternalLabelsToPixivn(getPixivnPlugin(server.config.plugins));
                        server.ws.send({
                            type: "custom",
                            event: "ink-updated",
                            data: {
                                inkJson: hasInkJsonManifestMode
                                    ? (virtualInkJsonData ?? [])
                                    : undefined,
                            },
                        });
                    }

                    return [];
                }

                if (file.endsWith(".json") && isManagedInkJsonFile(file)) {
                    await syncExternalLabelsToPixivn(getPixivnPlugin(server.config.plugins));
                    server.ws.send({
                        type: "custom",
                        event: "ink-updated",
                        data: {
                            inkJson: virtualInkJsonData ?? [],
                        },
                    });

                    return [];
                }
            },
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
            logUnknownHashtagCommands(source, hashtagCommandsStore, (message, line) =>
                this.warn({ message, loc: line !== undefined ? { line, column: 0 } : undefined }),
            );
            const pixivnLabelsT = getPixivnPlugin(resolvedConfig?.plugins)?.api?.labels ?? [];
            logUnknownDivertTargets(
                source,
                [...externalInkLabelIdsStore, ...pixivnLabelsT],
                (message, line) =>
                    this.warn({
                        message,
                        loc: line !== undefined ? { line, column: 0 } : undefined,
                    }),
            );

            // esporta source
            return {
                code: `export default ${JSON.stringify(source)};`,
                map: null,
            };
        },
    };
}
