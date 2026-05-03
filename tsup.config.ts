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
            skipNodeModulesBundle: false,
            noExternal: ["@drincs/pixi-vn-json"],
            external: ["vite", "@drincs/pixi-vn-ink/parser", "@drincs/pixi-vn-ink/mapper"],
            outExtension({ format }) {
                return {
                    js: format === "esm" ? ".mjs" : ".cjs",
                };
            },
        }),
    ];
});
