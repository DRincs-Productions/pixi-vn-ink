import { vitePluginInk } from "@drincs/pixi-vn-ink/vite";
import { vitePluginPixivn } from "@drincs/pixi-vn/vite";
import { defineConfig } from "vite";

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
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
