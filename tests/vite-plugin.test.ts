import { convertInkToJson } from "@/loader/ink-to-pixivn";
import { INK_DEV_API_HASHTAG_COMMANDS, INK_DEV_API_TEXT_REPLACES } from "@/vite/costants";
import type { InkHashtagCommandInfo, InkTextReplaceInfo } from "@/vite/info-types";
import { vitePluginInk } from "@/vite/plugins";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import type { ResolvedConfig } from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function createTempProject(): Promise<string> {
    return await fs.mkdtemp(path.join(os.tmpdir(), "pixi-vn-ink-vite-plugin-"));
}

function makeLogger() {
    return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function makeResolvedConfig(
    root: string,
    publicDir: string,
    logger = makeLogger(),
    plugins: unknown[] = [],
): ResolvedConfig {
    return { root, publicDir, plugins, logger } as unknown as ResolvedConfig;
}

async function readJsonFile(filePath: string) {
    return JSON.parse(await fs.readFile(filePath, "utf-8"));
}

const tempDirectories: string[] = [];

// The exported JSON's `$schema` points at a real, live `https://pixi-vn.com/...` URL. Stub
// `fetch` so the test suite doesn't depend on network access; an always-valid `{}` schema keeps
// every existing test's behavior unchanged, and individual tests can override this stub to
// exercise the schema-validation-warning path itself.
beforeEach(() => {
    vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })),
    );
});

afterEach(async () => {
    vi.unstubAllGlobals();
    await Promise.all(
        tempDirectories.map(async (directory) => {
            await fs.rm(directory, { recursive: true, force: true });
        }),
    );
    tempDirectories.length = 0;
});

describe("vitePluginInk", () => {
    it("exports matched ink files as json inside public and generates a manifest", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink", "chapter-1"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(
            path.join(root, "ink", "start.ink"),
            "=== start ===\nHello world!\n",
            "utf-8",
        );
        await fs.writeFile(
            path.join(root, "ink", "chapter-1", "second.ink"),
            "=== second ===\nAnother line.\n",
            "utf-8",
        );

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
        });

        plugin.configResolved?.(makeResolvedConfig(root, path.join(root, "public")));

        await plugin.buildStart?.call(undefined);

        const firstJsonPath = path.join(root, "public", "ink-json", "start.json");
        const secondJsonPath = path.join(root, "public", "ink-json", "chapter-1", "second.json");
        const manifestPath = path.join(root, "public", "ink-json", "manifest.json");

        await expect(fs.access(firstJsonPath)).resolves.toBeUndefined();
        await expect(fs.access(secondJsonPath)).resolves.toBeUndefined();

        const firstJson = await readJsonFile(firstJsonPath);
        const secondJson = await readJsonFile(secondJsonPath);
        const manifest = await readJsonFile(manifestPath);

        expect(firstJson).toBeTypeOf("object");
        expect(secondJson).toBeTypeOf("object");
        expect(manifest).toEqual(["/ink-json/chapter-1/second.json", "/ink-json/start.json"]);
    });

    it("warns about an unknown hashtag command on buildStart, not just on the next HMR edit", async () => {
        // Regression test: `# navigat ...` (a typo for `# navigate ...`) used to only be
        // reported once that specific `.ink` file was saved again (via `hotUpdate`) or directly
        // imported as a module (via `transform`) — a fresh `npm run dev` / `vite build` stayed
        // silent about it. Unknown-command detection must also run as part of the export pass
        // that happens on every startup and rebuild.
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(
            path.join(root, "ink", "start.ink"),
            "=== start ===\n# navigat /game/navigation\nHello world!\n",
            "utf-8",
        );

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
        });

        const logger = makeLogger();
        plugin.configResolved?.(makeResolvedConfig(root, path.join(root, "public"), logger));

        await plugin.buildStart?.call(undefined);

        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('Unknown hashtag command "# navigat /game/navigation"'),
            expect.anything(),
        );
    });

    it("removes stale exported json files when an ink file becomes invalid", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });

        const inkFile = path.join(root, "ink", "broken.ink");
        await fs.writeFile(inkFile, "=== start ===\nHello world!\n", "utf-8");

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
        });

        plugin.configResolved?.(makeResolvedConfig(root, path.join(root, "public")));

        await plugin.buildStart?.call(undefined);

        const jsonPath = path.join(root, "public", "ink-json", "broken.json");
        const manifestPath = path.join(root, "public", "ink-json", "manifest.json");

        await expect(fs.access(jsonPath)).resolves.toBeUndefined();

        await fs.writeFile(inkFile, "=== start ===\n{ not valid ink\n", "utf-8");
        await plugin.buildStart?.call(undefined);

        await expect(fs.access(jsonPath)).rejects.toBeDefined();
        await expect(readJsonFile(manifestPath)).resolves.toEqual([]);
    });

    it("exports json using a custom output pattern outside public", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink", "chapter-1"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(
            path.join(root, "ink", "start.ink"),
            "=== start ===\nHello world!\n",
            "utf-8",
        );
        await fs.writeFile(
            path.join(root, "ink", "chapter-1", "second.ink"),
            "=== second ===\nAnother line.\n",
            "utf-8",
        );

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./generated/ink-json/[path][name].json",
        });

        plugin.configResolved?.(makeResolvedConfig(root, path.join(root, "public")));

        await plugin.buildStart?.call(undefined);

        const firstJsonPath = path.join(root, "generated", "ink-json", "start.json");
        const secondJsonPath = path.join(root, "generated", "ink-json", "chapter-1", "second.json");
        const manifestPath = path.join(root, "generated", "ink-json", "manifest.json");

        await expect(fs.access(firstJsonPath)).resolves.toBeUndefined();
        await expect(fs.access(secondJsonPath)).resolves.toBeUndefined();
        await expect(readJsonFile(manifestPath)).resolves.toEqual([
            "generated/ink-json/chapter-1/second.json",
            "generated/ink-json/start.json",
        ]);
    });

    it("saves manifest to a custom path when inkJsonManifestPath is provided", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(
            path.join(root, "ink", "start.ink"),
            "=== start ===\nHello world!\n",
            "utf-8",
        );

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./generated/ink-json/[path][name].json",
            inkJsonManifestPath: "./public/ink-manifest.json",
        });

        plugin.configResolved?.(makeResolvedConfig(root, path.join(root, "public")));

        await plugin.buildStart?.call(undefined);

        const jsonPath = path.join(root, "generated", "ink-json", "start.json");
        const defaultManifestPath = path.join(root, "generated", "ink-json", "manifest.json");
        const customManifestPath = path.join(root, "public", "ink-manifest.json");

        await expect(fs.access(jsonPath)).resolves.toBeUndefined();
        await expect(fs.access(defaultManifestPath)).rejects.toBeDefined();
        await expect(readJsonFile(customManifestPath)).resolves.toEqual([
            "generated/ink-json/start.json",
        ]);
    });

    it("supports file and root-relative directory placeholders in output pattern", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(
            path.join(root, "ink", "second.ink"),
            "=== second ===\nAnother line.\n",
            "utf-8",
        );

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./generated/by-file/[file]-from-[dir][name].json",
        });

        plugin.configResolved?.(makeResolvedConfig(root, path.join(root, "public")));

        await plugin.buildStart?.call(undefined);

        const jsonPath = path.join(
            root,
            "generated",
            "by-file",
            "second.ink-from-ink",
            "second.json",
        );
        await expect(fs.access(jsonPath)).resolves.toBeUndefined();
    });

    it("treats inkGlob as rooted at project root (supports leading slash)", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "src", "stories"), { recursive: true });
        await fs.mkdir(path.join(root, "public", "stories"), { recursive: true });

        await fs.writeFile(
            path.join(root, "ink", "from-ink.ink"),
            "=== start ===\nInk.\n",
            "utf-8",
        );
        await fs.writeFile(
            path.join(root, "src", "stories", "from-src.ink"),
            "=== start ===\nSrc.\n",
            "utf-8",
        );
        await fs.writeFile(
            path.join(root, "public", "stories", "from-public.ink"),
            "=== start ===\nPublic.\n",
            "utf-8",
        );

        const plugin = vitePluginInk({
            inkGlob: "/**/*.ink",
            inkJsonOutputPattern: "./generated/[dir][name].json",
        });

        plugin.configResolved?.(makeResolvedConfig(root, path.join(root, "public")));

        await plugin.buildStart?.call(undefined);

        await expect(
            fs.access(path.join(root, "generated", "ink", "from-ink.json")),
        ).resolves.toBeUndefined();
        await expect(
            fs.access(path.join(root, "generated", "src", "stories", "from-src.json")),
        ).resolves.toBeUndefined();
        await expect(
            fs.access(path.join(root, "generated", "public", "stories", "from-public.json")),
        ).resolves.toBeUndefined();
    });

    it("virtual module exports undefined inkJsons when json export is disabled", async () => {
        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
        });

        const loaded = await plugin.load?.("\0virtual:pixi-vn-ink");

        expect(loaded).toContain("export const inkJsons = undefined;");
    });

    it("virtual module exports inkJsons entries when json export is enabled", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);

        const inkSource = "=== start ===\nHello world!\n";
        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(path.join(root, "ink", "start.ink"), inkSource, "utf-8");

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
        });

        plugin.configResolved?.(makeResolvedConfig(root, path.join(root, "public")));

        await plugin.buildStart?.call(undefined);
        const loaded = await plugin.load?.("\0virtual:pixi-vn-ink");

        const expectedJson = convertInkToJson(inkSource);
        expect(loaded).toContain(
            `export const inkJsons = ${JSON.stringify([expectedJson])};`,
        );
    });

    // Regression for #123: the build/dev converter resolves `characterId: text` speakers from
    // `vite-plugin-pixi-vn` `api.characters` and the `characters` option. Asserted via the in-memory
    // virtual module (load) to stay independent of on-disk JSON output.
    it("resolves characterId speakers from vite-plugin-pixi-vn api.characters at build time", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(
            path.join(root, "ink", "start.ink"),
            "=== start ===\nbob: Hi\n-> DONE\n",
            "utf-8",
        );

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
        });

        plugin.configResolved?.(
            makeResolvedConfig(root, path.join(root, "public"), makeLogger(), [
                {
                    name: "vite-plugin-pixi-vn",
                    api: {
                        contentLoaded: Promise.resolve(),
                        characters: [{ id: "bob" }],
                    },
                },
            ]),
        );

        await plugin.buildStart?.call(undefined);
        const loaded = await plugin.load?.("\0virtual:pixi-vn-ink");

        expect(loaded).toContain('"character":"bob"');
        expect(loaded).toContain('"text":"Hi"');
        // The literal "bob: Hi" prefix must NOT be baked into the dialogue text.
        expect(loaded).not.toContain("bob: Hi");
    });

    it("resolves characterId speakers from the explicit characters option at build time", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(
            path.join(root, "ink", "start.ink"),
            "=== start ===\nbob: Hi\n-> DONE\n",
            "utf-8",
        );

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
            characters: ["bob"],
        });

        // No vite-plugin-pixi-vn present: the explicit option is the only character source.
        plugin.configResolved?.(makeResolvedConfig(root, path.join(root, "public")));

        await plugin.buildStart?.call(undefined);
        const loaded = await plugin.load?.("\0virtual:pixi-vn-ink");

        expect(loaded).toContain('"character":"bob"');
        expect(loaded).toContain('"text":"Hi"');
        expect(loaded).not.toContain("bob: Hi");
    });

    it("rejects inkGlob patterns that escape project root", async () => {
        const plugin = vitePluginInk({
            inkGlob: "../**/*.ink",
            inkJsonOutputPattern: "./generated/[name].json",
        });

        expect(() =>
            plugin.configResolved?.({
                root: "/tmp/project",
                publicDir: "/tmp/project/public",
            } as ResolvedConfig),
        ).toThrow("must be rooted in Vite `root`");
    });

    it("hotUpdate for .ink includes inkJson in payload when json export is enabled", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);

        const inkSource = "=== start ===\nHello world!\n";
        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });

        const inkFile = path.join(root, "ink", "start.ink");
        await fs.writeFile(inkFile, inkSource, "utf-8");

        const wsSend = vi.fn();
        const logger = { warn: () => {}, error: () => {}, info: () => {} };

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (plugin.configResolved as any)?.(makeResolvedConfig(root, path.join(root, "public"), logger as any));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (plugin.buildStart as any)?.call(undefined);

        const hotUpdateHook = plugin.hotUpdate as { handler: Function };
        const result = await hotUpdateHook.handler({
            type: "update",
            file: inkFile,
            modules: [],
            timestamp: Date.now(),
            server: { config: { logger }, ws: { send: wsSend } },
            read: async () => inkSource,
        });

        const expectedJson = convertInkToJson(inkSource);
        expect(result).toEqual([]);
        expect(wsSend).toHaveBeenCalledWith({
            type: "custom",
            event: "ink-updated",
            data: { inkText: inkSource, inkJson: [expectedJson] },
        });
    });

    it("hotUpdate for managed .json emits ink-updated without reloading", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);

        const inkSource = "=== start ===\nHello world!\n";
        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });

        const inkFile = path.join(root, "ink", "start.ink");
        await fs.writeFile(inkFile, inkSource, "utf-8");

        const wsSend = vi.fn();
        const logger = { warn: () => {}, error: () => {}, info: () => {} };

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (plugin.configResolved as any)?.(makeResolvedConfig(root, path.join(root, "public"), logger as any));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (plugin.buildStart as any)?.call(undefined);

        const jsonFile = path.join(root, "public", "ink-json", "start.json");
        const hotUpdateHook = plugin.hotUpdate as { handler: Function };
        const result = await hotUpdateHook.handler({
            type: "update",
            file: jsonFile,
            modules: [],
            timestamp: Date.now(),
            server: { config: { logger }, ws: { send: wsSend } },
            read: async () => "",
        });

        const expectedJson = convertInkToJson(inkSource);
        expect(result).toEqual([]);
        expect(wsSend).toHaveBeenCalledWith({
            type: "custom",
            event: "ink-updated",
            data: { inkJson: [expectedJson] },
        });
    });

    it("syncs external ink labels to vite-plugin-pixi-vn after buildStart", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);

        const inkSource = "=== start ===\nHello world!\n";
        const updatedInkSource = "=== second ===\nUpdated.\n";
        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(path.join(root, "ink", "start.ink"), inkSource, "utf-8");

        const setExternalLabels = vi.fn();
        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
        });

        plugin.configResolved?.(
            makeResolvedConfig(root, path.join(root, "public"), makeLogger(), [
                {
                    name: "vite-plugin-pixi-vn",
                    api: {
                        contentLoaded: Promise.resolve(),
                        setExternalLabels,
                    },
                },
            ]),
        );

        await plugin.buildStart?.call(undefined);
        await plugin.buildStart?.call(undefined);
        await fs.writeFile(path.join(root, "ink", "start.ink"), updatedInkSource, "utf-8");
        await plugin.buildStart?.call(undefined);

        expect(setExternalLabels).toHaveBeenCalledTimes(2);
        expect(setExternalLabels).toHaveBeenNthCalledWith(1, "ink", ["start"]);
        expect(setExternalLabels).toHaveBeenNthCalledWith(2, "ink", ["second"]);
    });

    it("aggregates external ink labels across multiple files, including choice-derived labels", async () => {
        // Regression test: a project with more than one `.ink` file, where at least one knot
        // has choices (which the mapper expands into synthetic `<knot>_|_c-N` labels), must sync
        // *all* label ids from *every* file to `vite-plugin-pixi-vn` in one `setExternalLabels`
        // call — not just the labels from the last file processed.
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(
            path.join(root, "ink", "second_part.ink"),
            "=== second_part ===\nHello world!\n",
            "utf-8",
        );
        await fs.writeFile(
            path.join(root, "ink", "start.ink"),
            [
                "=== start ===",
                "Hello world!",
                "*  Choice one",
                "   Reply one",
                "*  Choice two",
                "   Reply two",
                "",
            ].join("\n"),
            "utf-8",
        );

        const setExternalLabels = vi.fn();
        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
        });

        plugin.configResolved?.(
            makeResolvedConfig(root, path.join(root, "public"), makeLogger(), [
                {
                    name: "vite-plugin-pixi-vn",
                    api: {
                        contentLoaded: Promise.resolve(),
                        setExternalLabels,
                    },
                },
            ]),
        );

        await plugin.buildStart?.call(undefined);

        expect(setExternalLabels).toHaveBeenCalledTimes(1);
        expect(setExternalLabels).toHaveBeenCalledWith("ink", [
            "second_part",
            "start",
            "start_|_c-0",
            "start_|_c-1",
        ]);
    });

    it("syncs external ink labels before `contentLoaded` resolves, without exporting JSON yet", async () => {
        // Regression test: `vite-plugin-pixi-vn` can take a while to resolve `contentLoaded`
        // during `vite build` (it spins up a whole secondary Vite server to load content). A
        // build-time type-checker (e.g. `vite-plugin-checker`) can run its one-shot check well
        // before that resolves and fail the build on an Ink label it doesn't know about yet. So
        // `setExternalLabels` must fire as soon as `buildStart` runs — it must not wait on
        // `contentLoaded` — even though the JSON export (which needs character data) still does.
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(
            path.join(root, "ink", "start.ink"),
            "=== start ===\nHello world!\n",
            "utf-8",
        );

        const setExternalLabels = vi.fn();
        let resolveContentLoaded!: () => void;
        const contentLoaded = new Promise<void>((resolve) => {
            resolveContentLoaded = resolve;
        });

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
        });

        plugin.configResolved?.(
            makeResolvedConfig(root, path.join(root, "public"), makeLogger(), [
                {
                    name: "vite-plugin-pixi-vn",
                    api: { contentLoaded, setExternalLabels },
                },
            ]),
        );

        const jsonPath = path.join(root, "public", "ink-json", "start.json");
        const buildStartPromise = plugin.buildStart?.call(undefined);

        // Give buildStart a chance to run past its synchronous/microtask work; `contentLoaded`
        // is still pending, so JSON export must not have run yet — but the label sync must have.
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(setExternalLabels).toHaveBeenCalledWith("ink", ["start"]);
        await expect(fs.access(jsonPath)).rejects.toThrow();

        resolveContentLoaded();
        await buildStartPromise;

        await expect(fs.access(jsonPath)).resolves.toBeUndefined();
    });

    it("buildStart waits for vite-plugin-nqtr's contentLoaded too, not just vite-plugin-pixi-vn's", async () => {
        // Regression test: content files often read ids/enums generated by `vite-plugin-nqtr`
        // (e.g. to build `createNqtrHandler` validators). JSON export must not run until NQTR
        // has finished writing its generated file — otherwise those handlers may still be
        // missing (or built from stale ids) when hashtag commands are resolved into JSON.
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(path.join(root, "ink", "start.ink"), "=== start ===\nHi!\n", "utf-8");

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
        });

        let resolveNqtrContentLoaded!: () => void;
        const nqtrContentLoaded = new Promise<void>((resolve) => {
            resolveNqtrContentLoaded = resolve;
        });

        plugin.configResolved?.(
            makeResolvedConfig(root, path.join(root, "public"), makeLogger(), [
                { name: "vite-plugin-pixi-vn", api: { contentLoaded: Promise.resolve() } },
                { name: "vite-plugin-nqtr", api: { contentLoaded: nqtrContentLoaded } },
            ]),
        );

        const jsonPath = path.join(root, "public", "ink-json", "start.json");
        const buildStartPromise = plugin.buildStart?.call(undefined);

        // Give buildStart a chance to run past any already-resolved awaits; it must still be
        // blocked on vite-plugin-nqtr's contentLoaded, so no JSON should exist yet.
        await new Promise((resolve) => setTimeout(resolve, 10));
        await expect(fs.access(jsonPath)).rejects.toThrow();

        resolveNqtrContentLoaded();
        await buildStartPromise;

        await expect(fs.access(jsonPath)).resolves.toBeUndefined();
    });

    it("clears external ink labels when no labels are exported", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });

        const clearExternalLabels = vi.fn();
        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
        });

        plugin.configResolved?.(
            makeResolvedConfig(root, path.join(root, "public"), makeLogger(), [
                {
                    name: "vite-plugin-pixi-vn",
                    api: {
                        contentLoaded: Promise.resolve(),
                        clearExternalLabels,
                    },
                },
            ]),
        );

        await plugin.buildStart?.call(undefined);

        expect(clearExternalLabels).toHaveBeenCalledTimes(1);
        expect(clearExternalLabels).toHaveBeenCalledWith("ink");
    });
});

/**
 * Helpers to run a Connect-style middleware list as a minimal HTTP test server.
 */
type MiddlewareFn = (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: () => void,
) => void | Promise<void>;

function makeTestServer(middleware: MiddlewareFn): http.Server {
    return http.createServer((req, res) => {
        void (async () => {
            let handled = false;
            const next = () => {
                handled = true;
            };
            await middleware(req, res, next);
            if (handled && !res.writableEnded) {
                res.statusCode = 404;
                res.end();
            }
        })();
    });
}

function request(
    server: http.Server,
    method: string,
    path: string,
    body?: string,
): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
        const addr = server.address() as { port: number };
        const req = http.request({ host: "127.0.0.1", port: addr.port, method, path }, (res) => {
            let data = "";
            res.on("data", (chunk: Buffer) => {
                data += chunk.toString();
            });
            res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
        });
        req.on("error", reject);
        if (body !== undefined) {
            req.write(body);
        }
        req.end();
    });
}

describe("vitePluginInk dev API", () => {
    const servers: http.Server[] = [];

    afterEach(async () => {
        await Promise.all(
            servers.map(
                (s) =>
                    new Promise<void>((resolve) => {
                        s.close(() => resolve());
                    }),
            ),
        );
        servers.length = 0;
    });

    function startPlugin(): Promise<{
        server: http.Server;
        middleware: MiddlewareFn;
        plugin: ReturnType<typeof vitePluginInk>;
    }> {
        const plugin = vitePluginInk();
        let middleware!: MiddlewareFn;

        // Capture the middleware registered via server.middlewares.use(fn)
        const fakeServer = {
            middlewares: {
                use(fn: MiddlewareFn) {
                    middleware = fn;
                },
            },
            config: { plugins: [] },
        };
        plugin.configureServer?.(fakeServer as any);

        const server = makeTestServer(middleware);
        servers.push(server);
        return new Promise<{
            server: http.Server;
            middleware: MiddlewareFn;
            plugin: ReturnType<typeof vitePluginInk>;
        }>((resolve) => {
            server.listen(0, "127.0.0.1", () => resolve({ server, middleware, plugin }));
        });
    }

    function createTransformContext(infos: string[]) {
        return {
            warn: (msg: string | { message: string }) => {
                infos.push(typeof msg === "string" ? msg : msg.message);
            },
            error: (message: string) => {
                throw new Error(message);
            },
            info: (message: string) => {
                infos.push(message);
            },
        };
    }

    it("GET hashtag-commands returns the built-in mapper commands initially", async () => {
        // `HashtagCommands` registers its built-in `.addMapper()` translators (Call, Jump, ...)
        // at module load, so the real store is never empty even before any content file adds
        // custom handlers — regression coverage for syncStores reading the actual shared
        // `HashtagCommands` singleton instead of a separate, always-empty instance.
        const { server } = await startPlugin();
        const res = await request(server, "GET", INK_DEV_API_HASHTAG_COMMANDS);
        expect(res.status).toBe(200);
        const body = JSON.parse(res.body) as InkHashtagCommandInfo[];
        expect(body.length).toBeGreaterThan(0);
        expect(body.some((entry) => entry.name === "Call")).toBe(true);
    });

    it("GET text-replaces returns empty array initially", async () => {
        const { server } = await startPlugin();
        const res = await request(server, "GET", INK_DEV_API_TEXT_REPLACES);
        expect(res.status).toBe(200);
        expect(JSON.parse(res.body)).toEqual([]);
    });

    it("POST hashtag-commands stores the data and GET returns it", async () => {
        const { server } = await startPlugin();
        const info: InkHashtagCommandInfo[] = [
            {
                name: "navigate",
                description: "Navigate to a scene",
                validation: { type: "regexp", source: "^navigate\\b", flags: "" },
            },
        ];
        const postRes = await request(
            server,
            "POST",
            INK_DEV_API_HASHTAG_COMMANDS,
            JSON.stringify(info),
        );
        expect(postRes.status).toBe(204);

        const getRes = await request(server, "GET", INK_DEV_API_HASHTAG_COMMANDS);
        expect(JSON.parse(getRes.body)).toEqual(info);
    });

    it("POST text-replaces stores the data and GET returns it", async () => {
        const { server } = await startPlugin();
        const info: InkTextReplaceInfo[] = [
            {
                name: "character-name",
                description: "Replace IDs with names",
                type: "after-translation",
                validation: { type: "literal", value: "characterId" },
            },
        ];
        const postRes = await request(
            server,
            "POST",
            INK_DEV_API_TEXT_REPLACES,
            JSON.stringify(info),
        );
        expect(postRes.status).toBe(204);

        const getRes = await request(server, "GET", INK_DEV_API_TEXT_REPLACES);
        expect(JSON.parse(getRes.body)).toEqual(info);
    });

    it("transform logs info for unknown hashtag commands and suggests the dev API", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);
        const inkPath = path.join(root, "story.ink");
        await fs.writeFile(inkPath, "=== start ===\n# known one\n# unknown two\n", "utf-8");

        const { server, plugin } = await startPlugin();
        const info: InkHashtagCommandInfo[] = [
            {
                name: "known",
                validation: { type: "regexp", source: "^known\\b", flags: "" },
            },
        ];
        await request(server, "POST", INK_DEV_API_HASHTAG_COMMANDS, JSON.stringify(info));

        const infos: string[] = [];
        await plugin.transform?.call(createTransformContext(infos) as any, "", inkPath);

        expect(
            infos.some((message) => message.includes('Unknown hashtag command "# unknown two"')),
        ).toBe(true);
        expect(infos.some((message) => message.includes(INK_DEV_API_HASHTAG_COMMANDS))).toBe(true);
    });

    it("transform does not log unknown-command info when every hashtag command is known", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);
        const inkPath = path.join(root, "story-known.ink");
        await fs.writeFile(inkPath, "=== start ===\n# known one\n", "utf-8");

        const { server, plugin } = await startPlugin();
        const info: InkHashtagCommandInfo[] = [
            {
                name: "known",
                validation: { type: "regexp", source: "^known\\b", flags: "" },
            },
        ];
        await request(server, "POST", INK_DEV_API_HASHTAG_COMMANDS, JSON.stringify(info));

        const infos: string[] = [];
        await plugin.transform?.call(createTransformContext(infos) as any, "", inkPath);

        expect(infos.some((m) => m.includes("Unknown hashtag command"))).toBe(false);
    });

    it("unrelated paths fall through to next", async () => {
        const { server } = await startPlugin();
        const res = await request(server, "GET", "/some-other-path");
        expect(res.status).toBe(404);
    });

    it("warns with the ink $origin when exported JSON fails schema validation", async () => {
        // Regression coverage for schema-drift detection: after export, the JSON is validated
        // against the schema its own `$schema` field points at. A mismatch is expected to
        // usually live inside an `operations` entry (e.g. a hashtag command producing a
        // slightly-off shape), so the warning must surface that operation's `$origin` — the
        // original `# ...` ink source line — not just an opaque JSON pointer.
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(
            path.join(root, "ink", "start.ink"),
            "=== start ===\n# lazyload assets myAlias\nHello world!\n-> DONE\n",
            "utf-8",
        );

        // A schema that's intentionally stricter than reality: it requires every operation's
        // `aliases` field to be a string, while the real converted operation always emits an
        // array of strings — guaranteeing a validation failure to assert against.
        const strictSchema = {
            type: "object",
            properties: {
                labels: {
                    type: "object",
                    additionalProperties: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                operations: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            aliases: { type: "string" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        };
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => new Response(JSON.stringify(strictSchema), { status: 200 })),
        );

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
        });

        const logger = makeLogger();
        plugin.configResolved?.(makeResolvedConfig(root, path.join(root, "public"), logger));

        await plugin.buildStart?.call(undefined);

        const warnedMessage = logger.warn.mock.calls
            .map(([message]) => String(message))
            .find((message) => message.includes(path.join(root, "ink", "start.ink")));

        expect(warnedMessage).toBeDefined();
        expect(warnedMessage).toContain("aliases");
        expect(warnedMessage).toContain("from ink source:");
        expect(warnedMessage).toContain("# lazyload assets myAlias");
    });

    it("collapses a widely-fanned-out anyOf failure into one specific warning per field", async () => {
        // A schema this recursive reports one error per rejected anyOf branch, several levels
        // deep — a single bad value can fan out into dozens of "must have required property X"
        // complaints about branches that were never the intended shape. Only the specific,
        // actionable complaint about the field that's actually wrong should survive, once per
        // field (not once per branch/nesting level it happened to be re-checked at).
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(
            path.join(root, "ink", "start.ink"),
            "=== start ===\n# lazyload assets myAlias\nHello world!\n-> DONE\n",
            "utf-8",
        );

        // A deliberately wide union (mirroring how a real operation type is one of many in the
        // real schema) where every branch requires a distinct field the real operation doesn't
        // have, plus one branch with a genuinely specific, actionable mismatch on `aliases`.
        const wideUnionSchema = {
            type: "object",
            properties: {
                labels: {
                    type: "object",
                    additionalProperties: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                operations: {
                                    type: "array",
                                    items: {
                                        anyOf: [
                                            { type: "object", required: ["notAField1"] },
                                            { type: "object", required: ["notAField2"] },
                                            { type: "object", required: ["notAField3"] },
                                            {
                                                type: "object",
                                                properties: { aliases: { type: "string" } },
                                                required: ["aliases"],
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            },
        };
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => new Response(JSON.stringify(wideUnionSchema), { status: 200 })),
        );

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
        });

        const logger = makeLogger();
        plugin.configResolved?.(makeResolvedConfig(root, path.join(root, "public"), logger));

        await plugin.buildStart?.call(undefined);

        const schemaWarnings = logger.warn.mock.calls
            .map(([message]) => String(message))
            .filter((message) => message.includes(path.join(root, "ink", "start.ink")));

        expect(schemaWarnings).toHaveLength(1);
        expect(schemaWarnings[0]).toContain("aliases");
        expect(schemaWarnings.some((message) => message.includes("notAField"))).toBe(false);
        expect(schemaWarnings.some((message) => message.includes("anyOf"))).toBe(false);
    });

    it("reports an unreachable schema URL once and skips validation entirely", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(
            path.join(root, "ink", "start.ink"),
            "=== start ===\nHello world!\n-> DONE\n",
            "utf-8",
        );

        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                throw new TypeError("fetch failed");
            }),
        );

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
        });

        const logger = makeLogger();
        plugin.configResolved?.(makeResolvedConfig(root, path.join(root, "public"), logger));

        await plugin.buildStart?.call(undefined);

        const warnings = logger.warn.mock.calls.map(([message]) => String(message));
        expect(
            warnings.some(
                (message) =>
                    message.includes("Could not load/compile JSON schema") &&
                    message.includes("Skipping schema validation"),
            ),
        ).toBe(true);
        expect(
            warnings.some((message) => message.includes(path.join(root, "ink", "start.ink"))),
        ).toBe(false);
    });
});
