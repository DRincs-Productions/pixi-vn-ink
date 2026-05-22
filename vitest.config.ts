import tsconfigPaths from "vite-tsconfig-paths";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

function virtualPixiVnInkPlugin(): Plugin {
    const id = "virtual:pixi-vn-ink";
    const resolvedId = `\0${id}`;
    return {
        name: "virtual-pixi-vn-ink-mock",
        resolveId(source) {
            if (source === id) return resolvedId;
        },
        load(source) {
            if (source === resolvedId) {
                return "export const inkJsons = undefined; export default [];";
            }
        },
    };
}

export default defineConfig({
    plugins: [
        tsconfigPaths({ projects: ["./tsconfig.json", "./tests/tsconfig.json"] }),
        virtualPixiVnInkPlugin(),
    ],
    test: {
        environment: "jsdom",
        setupFiles: ["tests/setup.ts"],
    },
});
