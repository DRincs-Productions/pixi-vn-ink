import { LabelJsonType } from "@drincs/pixi-vn";
import { Compiler } from "inkjs/compiler/Compiler";
import InkStoryType from "../types/InkStoryType";
import { getInkLabel } from "./StoryInfoConverter";

export function convertInkText(text: string): LabelJsonType | undefined {
    let json = convertorInkToJson(text);
    let obj: InkStoryType
    try {
        obj = JSON.parse(json);
    } catch (e) {
        console.error("[Pixi'VN Ink] Error parsing ink file", e)
        return
    }

    return getInkLabel(obj.root)
}

function convertorInkToJson(test: string): string {
    try {
        const story = new Compiler(test).Compile();
        let json = story.ToJson();
        console.log(json);
        return json || "";
    } catch (e) {
        console.error("[Pixi'VN] Error compiling ink file", e)
        return ""
    }
}
