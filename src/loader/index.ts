export { importInkText, importJson } from "@/loader/importer";
export {
    /**
     * @deprecated use convertInkToJson instead
     */
    convertInkToJson as convertInkText,
    convertInkToJson,
    convertJsonToInk,
} from "@/converter";
export type { CharacterIdSource } from "@/converter";
