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

type Typew = "done" | { "#n": string }

type Label = {
    [labelId: string]: (
        string |
        '\n' |
        null |
        { "->": string }
    )[]
}

type Item = Typew | Item[] | Label

type JsonLabelsType = {
    inkVersion: number,
    listDefs: {},
    root: Item[],
}

function addLabels(item: object, labels: { [labelId: string]: StepLabelJsonType[] }) {
    // for value and key in item
    for (const [key, value] of Object.entries(item)) {
        // if value is an array
        if (value instanceof Array) {
            let aaaa: StepLabelJsonType[] = []
            value.forEach((v) => {
                if (typeof v === "string") {
                    if (v !== '\n') {
                        aaaa.push({
                            dialog: v
                        })
                    }
                }
                else {
                    console.log("ignore", v)
                }
            })
            if (aaaa.length > 0) {
                labels[key] = aaaa
            }

        }
        else {
            console.log(value)
        }
    }
}

function findLabel(items: Item[], labels: { [labelId: string]: StepLabelJsonType[] }) {
    for (const item of items) {
        if (typeof item === "object") {
            if (item instanceof Array) {
                findLabel(item, labels)
            }
            else if (item === null) {
            }
            // is object
            else if (typeof item === "object") {
                addLabels(item, labels)
            }
            else {
                console.log(item)
            }
        }
    }
}

export function getJsonLabels(json: string): { [labelId: string]: StepLabelJsonType[] } | undefined {
    try {
        // convert the json string to object
        let obj: JsonLabelsType = JSON.parse(json);
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

        let label: { [labelId: string]: StepLabelJsonType[] } = {}

        findLabel(obj.root, label)

        return {};
    } catch (e) {
        console.error("[Pixi'VN Ink] Error parsing json", e)
    }
}
