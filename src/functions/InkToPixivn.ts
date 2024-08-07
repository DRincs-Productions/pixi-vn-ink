import { ChoiceMenuOptionsType } from "@drincs/pixi-vn";
import { Compiler } from "inkjs/compiler/Compiler";
import InkStoryType from "../types/InkStoryType";
import { getInkLabel } from "./StoryInfoConverter";

export type StepLabelJsonType = {
    currentChoiceMenuOptions?: ChoiceMenuOptionsType<{}>
    dialog?: {
        character: string,
        text: string,
    } | string
    labelToOpen?: {
        labelId: string,
        type: "jump" | "call",
    }
}

export function convertInkText(text: string): { [labelId: string]: StepLabelJsonType[] } | undefined {
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
        throw e
    }
}
