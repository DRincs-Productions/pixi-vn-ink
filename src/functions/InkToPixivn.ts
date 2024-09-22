import { PixiVNJson } from "@drincs/pixi-vn-json";
import { Compiler } from "inkjs/compiler/Compiler";
import { GLOBAL_DECL, MY_LABEL_KER_EXTERNAL_VALUE } from "../constant";
import InkStoryType from "../types/InkStoryType";
import { getInkLabel } from "./StoryInfoConverter";

/**
 * This function converts string written in ink language into the LabelJsonType.
 * @param text string or array of strings written in ink language
 * @returns LabelJsonType or undefined
 */
export function convertInkText(text: string): PixiVNJson | undefined {
    let result: PixiVNJson = {}
    let json = convertorInkToJson(text);
    let obj: InkStoryType
    try {
        obj = JSON.parse(json);
    } catch (e) {
        console.error("[Pixi’VN Ink] Error parsing ink file")
        return
    }

    result.labels = getInkLabel(obj.root)
    if (result.labels && GLOBAL_DECL in result.labels) {
        let global = result.labels[GLOBAL_DECL]
        delete result.labels[GLOBAL_DECL]
        global.forEach((item) => {
            if (item.operation) {
                result.initialOperations = result.initialOperations ? [...result.initialOperations, ...item.operation] : [...item.operation]
            }
        })
    }
    if (result.labels && MY_LABEL_KER_EXTERNAL_VALUE in result.labels) {
        let global = result.labels[MY_LABEL_KER_EXTERNAL_VALUE]
        delete result.labels[MY_LABEL_KER_EXTERNAL_VALUE]
        global.forEach((item) => {
            if (item.operation) {
                result.initialOperations = result.initialOperations ? [...result.initialOperations, ...item.operation] : [...item.operation]
            }
        })
    }

    return result
}

function convertorInkToJson(test: string): string {
    try {
        const story = new Compiler(test).Compile();
        let json = story.ToJson();
        return json || "";
    } catch (e) {
        console.error("[Pixi’VN Ink] Error compiling ink file", e)
        return ""
    }
}
