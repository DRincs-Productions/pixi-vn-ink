import { vitePluginInk } from "@/vite/plugins";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ResolvedConfig } from "vite";
import { afterEach, describe, expect, it } from "vitest";

async function createTempProject(): Promise<string> {
    return await fs.mkdtemp(path.join(os.tmpdir(), "pixi-vn-ink-vite-plugin-"));
}

async function readJsonFile(filePath: string) {
    return JSON.parse(await fs.readFile(filePath, "utf-8"));
}

const tempDirectories: string[] = [];

afterEach(async () => {
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
            inkJsonPublicDir: "ink-json",
        });

        plugin.configResolved?.({
            root,
            publicDir: path.join(root, "public"),
        } as ResolvedConfig);

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
        expect(manifest).toEqual([
            "/ink-json/chapter-1/second.json",
            "/ink-json/start.json",
        ]);
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
            inkJsonPublicDir: "ink-json",
        });

        plugin.configResolved?.({
            root,
            publicDir: path.join(root, "public"),
        } as ResolvedConfig);

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

        plugin.configResolved?.({
            root,
            publicDir: path.join(root, "public"),
        } as ResolvedConfig);

        await plugin.buildStart?.call(undefined);

        const firstJsonPath = path.join(root, "generated", "ink-json", "start.json");
        const secondJsonPath = path.join(
            root,
            "generated",
            "ink-json",
            "chapter-1",
            "second.json",
        );
        const manifestPath = path.join(root, "generated", "ink-json", "manifest.json");

        await expect(fs.access(firstJsonPath)).resolves.toBeUndefined();
        await expect(fs.access(secondJsonPath)).resolves.toBeUndefined();
        await expect(readJsonFile(manifestPath)).resolves.toEqual([
            "generated/ink-json/chapter-1/second.json",
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

        plugin.configResolved?.({
            root,
            publicDir: path.join(root, "public"),
        } as ResolvedConfig);

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

        await fs.writeFile(path.join(root, "ink", "from-ink.ink"), "=== start ===\nInk.\n", "utf-8");
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

        plugin.configResolved?.({
            root,
            publicDir: path.join(root, "public"),
        } as ResolvedConfig);

        await plugin.buildStart?.call(undefined);

        await expect(fs.access(path.join(root, "generated", "ink", "from-ink.json"))).resolves.toBeUndefined();
        await expect(
            fs.access(path.join(root, "generated", "src", "stories", "from-src.json")),
        ).resolves.toBeUndefined();
        await expect(
            fs.access(path.join(root, "generated", "public", "stories", "from-public.json")),
        ).resolves.toBeUndefined();
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
});
