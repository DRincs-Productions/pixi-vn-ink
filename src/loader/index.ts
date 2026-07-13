export { importInkText, importJson } from "@/loader/importer";
export {
    /**
     * @deprecated use convertInkToJson instead
     */
    convertInkToJson as convertInkText,
    convertInkToJson,
} from "@/converter";
export type { CharacterIdSource } from "@/converter";
