// Narrow entry point for consumers that only need the dev-server API path constants and their
// response-shape types — not `vitePluginInk` itself, which (through `vite-plugin-pixi-vn`
// interop) needs `@drincs/pixi-vn`'s canvas/sound/narration/storage modules, and therefore
// pixi.js's browser-only `DOMAdapter`. Both `@/vite/costants` and `@/vite/info-types` are plain
// string literals / type declarations with no such dependency, so importing this module is safe
// from any context, including a plain Node.js process with no DOM.
export { INK_DEV_API_HASHTAG_COMMANDS, INK_DEV_API_INFO, INK_DEV_API_TEXT_REPLACES } from "@/vite/costants";
export type { InkHashtagCommandInfo, InkLibraryInfo, InkTextReplaceInfo } from "@/vite/info-types";
