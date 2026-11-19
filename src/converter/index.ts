export {
    /**
     * @deprecated use convertInkToJson instead
     */
    convertInkToJson as convertInkText,
    convertInkToJson,
    convertJsonToInk,
    normalizeCharacterIds,
} from "@/converter/converter";
export type { JsonToInkOptions } from "@/converter/converter";
export type { CharacterIdSource, LoaderSharedType } from "@/converter/type";
