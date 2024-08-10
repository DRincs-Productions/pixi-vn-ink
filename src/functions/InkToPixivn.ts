import { PixiVNJson } from "@drincs/pixi-vn";
import { Compiler } from "inkjs/compiler/Compiler";
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
        console.error("[Pixi’VN Ink] Error parsing ink file", e)
        return
    }

    result.labels = getInkLabel(obj.root)

    return result
}

function convertorInkToJson(test: string): string {
    try {
        const story = new Compiler(test).Compile();
        let json = story.ToJson();
        console.log(json);
        return json || "";
    } catch (e) {
        console.error("[Pixi’VN] Error compiling ink file", e)
        return ""
    }
}
