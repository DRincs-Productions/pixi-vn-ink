export { onInkHashtagScript } from "./hashtag-script";
export { importInkText, importJson } from "./importer";
export {
    /**
     * @deprecated use convertInkToJson instead
     */
    convertInkToJson as convertInkText,
    convertInkToJson,
} from "./ink-to-pixivn";
export { onReplaceTextAfterTranslation, onReplaceTextBeforeTranslation } from "./replace";
export { generateJsonInkTranslation, onInkTranslate } from "./translate";
