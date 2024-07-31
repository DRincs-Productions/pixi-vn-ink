import { ChoiceMenuOptionsType } from '@drincs/pixi-vn';
import { Compiler } from "inkjs/compiler/Compiler";
export function convertorInkToJson(test: string): string {
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

type StepLabelJsonType = {
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

export function getJsonLabels(json: string): { [labelId: string]: StepLabelJsonType[] } {
    // todo: implement this function
    // labelId is the name of the label, in ink it is the text between === ===

    // the array of StepLabelJsonType is the list of steps that are in that label

    // for example, in the label === back_in_london ===
    // there are two steps:
    // 1. We arrived into London at 9.45pm exactly.
    // 2. -> hurry_home

    // so the return value should be:
    // {
    //     back_in_london: [
    //         {
    //             dialog: "We arrived into London at 9.45pm exactly."
    //         },
    //         {
    //             labelToOpen: {
    //                 labelId: "hurry_home",
    //                 type: "call"
    //             }
    //         }
    //     ]
    // }

    return {};
}
