import { defineConfig, type Options } from "tsup";

export default defineConfig((options) => {
    const sourcemap = Boolean(options.watch);
    const createConfig = (config: Options): Options => ({
        sourcemap,
        ...config,
    });

    return [
        createConfig({
            target: "es2020",
            entry: {
                parser: "src/parser/index.ts",
                mapper: "src/mapper/index.ts",
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
        }),
        createConfig({
            target: "es2020",
            entry: {
                index: "src/index.ts",
                vite: "src/vite/index.ts",
                "vite-listener": "src/vite-listener/index.ts",
            },
            format: ["cjs", "esm"],
            dts: true,
            treeshake: true,
            clean: false,
            minify: true,
            bundle: true,
            skipNodeModulesBundle: false,
            noExternal: [
                "@drincs/pixi-vn-json",
                "@drincs/pixi-vn-json/translator",
                "@drincs/pixi-vn-json/core",
                "@drincs/pixi-vn-json/importer",
                "@drincs/pixi-vn-ink/parser",
                "@drincs/pixi-vn-ink/mapper",
            ],
            external: ["vite"],
            outExtension({ format }) {
                return {
                    js: format === "esm" ? ".mjs" : ".cjs",
                };
            },
        }),
    ];
});
