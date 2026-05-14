export {
    INK_DEV_API_GENERATE_JSON,
    INK_DEV_API_HASHTAG_COMMANDS,
    INK_DEV_API_TEXT_REPLACES,
} from "@/vite/costants";
export type { InkHashtagCommandInfo, InkTextReplaceInfo } from "@/vite/info-types";
export {
    /**
     * @deprecated use vitePluginInk instead
     */
    vitePluginInk as noHmrInkPlugin,
    vitePluginInk,
} from "@/vite/plugins";
export type { VitePluginInkOptions } from "@/vite/plugins";
