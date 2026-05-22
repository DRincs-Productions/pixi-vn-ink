import { vitePluginInk } from "@drincs/pixi-vn-ink/vite";
import { vitePluginPixivn } from "@drincs/pixi-vn/vite";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "../src"),
        },
    },
    plugins: [
        vitePluginPixivn(),
        vitePluginInk({
            inkGlob: "./ink/**/*.ink",
            inkJsonOutputPattern: "./public/ink-json/[path][name].gen.json",
            inkJsonManifestPath: "./src/assets/ink-manifest.gen.json",
        }),
    ],
});
