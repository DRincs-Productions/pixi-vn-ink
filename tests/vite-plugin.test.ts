import { vitePluginInk } from "@/vite/plugins";
import {
    INK_DEV_API_GENERATE_JSON,
    INK_DEV_API_HASHTAG_COMMANDS,
    INK_DEV_API_TEXT_REPLACES,
} from "@/vite/costants";
import type { InkHashtagCommandInfo, InkTextReplaceInfo } from "@/vite/info-types";
import fs from "node:fs/promises";
import http from "node:http";
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
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
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
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
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

        plugin.configResolved?.({
            root,
            publicDir: path.join(root, "public"),
        } as ResolvedConfig);

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

    it("virtual module exports undefined inkJsonManifest when json export is disabled", async () => {
        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
        });

        const loaded = await plugin.load?.("\0virtual:pixi-vn-ink");

        expect(loaded).toContain("export const inkJsonManifest = undefined;");
    });

    it("virtual module exports inkJsonManifest entries when json export is enabled", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);

        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(path.join(root, "ink", "start.ink"), "=== start ===\nHello world!\n", "utf-8");

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
        });

        plugin.configResolved?.({
            root,
            publicDir: path.join(root, "public"),
        } as ResolvedConfig);

        await plugin.buildStart?.call(undefined);
        const loaded = await plugin.load?.("\0virtual:pixi-vn-ink");

        expect(loaded).toContain('export const inkJsonManifest = ["/ink-json/start.json"];');
    });

    it("skips page reload for managed ink json updates", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);
        await fs.mkdir(path.join(root, "public"), { recursive: true });

        const plugin = vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].json",
            inkJsonManifestPath: "./public/ink-manifest.json",
        });

        plugin.configResolved?.({
            command: "serve",
            root,
            publicDir: path.join(root, "public"),
        } as ResolvedConfig);

        const sentMessages: Array<Record<string, unknown>> = [];
        const result = await plugin.handleHotUpdate?.({
            file: path.join(root, "public", "ink-manifest.json"),
            server: {
                ws: {
                    send(message: Record<string, unknown>) {
                        sentMessages.push(message);
                    },
                },
            } as any,
            read: async () => "",
        } as any);

        expect(result).toEqual([]);
        expect(sentMessages).toContainEqual({
            type: "custom",
            event: "ink-json-updated",
        });
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
        const req = http.request(
            { host: "127.0.0.1", port: addr.port, method, path },
            (res) => {
                let data = "";
                res.on("data", (chunk: Buffer) => {
                    data += chunk.toString();
                });
                res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
            },
        );
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

    function startPlugin(
        options?: Parameters<typeof vitePluginInk>[0],
        config?: Partial<ResolvedConfig>,
    ): Promise<{
        server: http.Server;
        middleware: MiddlewareFn;
        plugin: ReturnType<typeof vitePluginInk>;
    }> {
        const plugin = vitePluginInk(options);
        let middleware!: MiddlewareFn;

        // Capture the middleware registered via server.middlewares.use(fn)
        const fakeServer = {
            middlewares: {
                use(fn: MiddlewareFn) {
                    middleware = fn;
                },
            },
        };
        if (config) {
            plugin.configResolved?.(config as ResolvedConfig);
        }
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
            warn: () => {},
            error: (message: string) => {
                throw new Error(message);
            },
            info: (message: string) => {
                infos.push(message);
            },
        };
    }

    it("GET hashtag-commands returns empty array initially", async () => {
        const { server } = await startPlugin();
        const res = await request(server, "GET", INK_DEV_API_HASHTAG_COMMANDS);
        expect(res.status).toBe(200);
        expect(JSON.parse(res.body)).toEqual([]);
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

    it("POST generate-json exports ink JSON in serve mode only when called", async () => {
        const root = await createTempProject();
        tempDirectories.push(root);
        await fs.mkdir(path.join(root, "ink"), { recursive: true });
        await fs.mkdir(path.join(root, "public"), { recursive: true });
        await fs.writeFile(path.join(root, "ink", "start.ink"), "=== start ===\nHello world!\n", "utf-8");

        const { server } = await startPlugin(
            {
                inkGlob: "./ink/**/*.ink",
                inkJsonOutputPattern: "./public/ink-json/[path][name].json",
            },
            {
                command: "serve",
                root,
                publicDir: path.join(root, "public"),
            },
        );

        const jsonPath = path.join(root, "public", "ink-json", "start.json");
        await expect(fs.access(jsonPath)).rejects.toBeDefined();

        const postRes = await request(server, "POST", INK_DEV_API_GENERATE_JSON);
        expect(postRes.status).toBe(204);

        await expect(fs.access(jsonPath)).resolves.toBeUndefined();
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
        await plugin.transform?.call(
            createTransformContext(infos) as any,
            "",
            inkPath,
        );

        expect(infos.some((message) => message.includes('Unknown hashtag command "# unknown two"'))).toBe(
            true,
        );
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
        await plugin.transform?.call(
            createTransformContext(infos) as any,
            "",
            inkPath,
        );

        expect(infos).toEqual([]);
    });

    it("unrelated paths fall through to next", async () => {
        const { server } = await startPlugin();
        const res = await request(server, "GET", "/some-other-path");
        expect(res.status).toBe(404);
    });
});
