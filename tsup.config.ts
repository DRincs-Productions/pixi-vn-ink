import { defineConfig, type Options } from "tsup";

export default defineConfig((options) => {
    const sourcemap = Boolean(options.watch);
    const createConfig = (config: Options): Options => ({
        sourcemap,
        ...config,
    });

    return [
        createConfig({
            target: "es2022",
            entry: {
                parser: "src/parser/index.ts",
                mapper: "src/mapper/index.ts",
                converter: "src/converter/index.ts",
                "dev-api": "src/vite/dev-api.ts",
            },
            format: ["cjs", "esm"],
            treeshake: true,
            splitting: false,
            clean: true,
            minify: true,
            skipNodeModulesBundle: false,
            // Bundled in (rather than left as a runtime import) so `ajv` can move from
            // `dependencies` to `devDependencies` — consumers of `@drincs/pixi-vn-ink/parser`
            // (and anything re-exporting it: `/converter`, `/dev-api`, `/vite`) get it for free
            // from the compiled output instead of needing it installed separately.
            noExternal: ["ajv"],
            outExtension({ format }) {
                return {
                    js: format === "esm" ? ".mjs" : ".cjs",
                };
            },
        }),
        createConfig({
            target: "es2022",
            entry: {
                index: "src/index.ts",
                vite: "src/vite/index.ts",
                "vite-listener": "src/vite-listener/index.ts",
            },
            format: ["cjs", "esm"],
            treeshake: true,
            clean: false,
            minify: true,
            skipNodeModulesBundle: false,
            noExternal: ["@drincs/pixi-vn-json", "ajv"],
            external: [
                "vite",
                "@drincs/pixi-vn-ink/parser",
                "@drincs/pixi-vn-ink/mapper",
                "@drincs/pixi-vn-ink/converter",
                "virtual:pixi-vn-ink",
                "@drincs/pixi-vn",
                "zod",
            ],
            outExtension({ format }) {
                return {
                    js: format === "esm" ? ".mjs" : ".cjs",
                };
            },
        }),
        createConfig({
            target: "es2022",
            entry: {
                parser: "src/parser/index.ts",
                mapper: "src/mapper/index.ts",
                converter: "src/converter/index.ts",
                "dev-api": "src/vite/dev-api.ts",
                index: "src/index.ts",
                vite: "src/vite/index.ts",
                "vite-listener": "src/vite-listener/index.ts",
            },
            format: ["cjs", "esm"],
            dts: { only: true },
            clean: false,
            external: [
                "vite",
                "@drincs/pixi-vn-ink/parser",
                "@drincs/pixi-vn-ink/mapper",
                "@drincs/pixi-vn-ink/converter",
                "virtual:pixi-vn-ink",
                "@drincs/pixi-vn",
                "zod",
            ],
        }),
    ];
});
