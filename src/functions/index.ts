export { importInkText, importJson } from "./importer";
export {
    convertInkStoryToJson,
    /**
     * @deprecated use convertInkToJson instead
     */
    convertInkToJson as convertInkText,
    convertInkToJson,
} from "./ink-to-pixivn";
export { onReplaceTextAfterTranslation, onReplaceTextBeforeTranslation } from "./replace";
export { generateJsonInkTranslation, onInkTranslate } from "./translate";
