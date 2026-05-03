import { defineConfig } from "tsup";

// https://dev.to/orabazu/how-to-bundle-a-tree-shakable-typescript-library-with-tsup-and-publish-with-npm-3c46
export default defineConfig([
    {
        target: "es2020",
        entry: {
            parser: "src/parser/index.ts",
        },
        format: ["cjs", "esm"],
        dts: true,
        treeshake: true,
        splitting: false,
        clean: true,
        minify: true,
        bundle: true,
        skipNodeModulesBundle: false,
        outExtension({ format }) {
            return {
                js: format === "esm" ? ".mjs" : ".cjs",
            };
        },
    },
    {
        target: "es2020",
        entry: {
            index: "src/index.ts",
            vite: "src/vite/index.ts",
            "vite-listener": "src/vite-listener/index.ts",
        },
        format: ["cjs", "esm"], // Build for commonJS and ESmodules
        dts: true, // Generate declaration file (.d.ts)
        treeshake: true,
        // sourcemap: true, // Generate sourcemap, it was removed because otherwise it would explode
        clean: false,
        minify: true,
        bundle: true,
        skipNodeModulesBundle: false, // Skip bundling of node_modules
        noExternal: [
            "@drincs/pixi-vn-json",
            "@drincs/pixi-vn-json/translator",
            "@drincs/pixi-vn-json/core",
            "@drincs/pixi-vn-json/importer",
            "@drincs/pixi-vn-ink/parser",
        ],
        external: ["vite"],
        outExtension({ format }) {
            return {
                js: format === "esm" ? ".mjs" : ".cjs",
            };
        },
    },
]);
