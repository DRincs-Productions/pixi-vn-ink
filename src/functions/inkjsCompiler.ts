import { ChoiceMenuOptionsType } from '@drincs/pixi-vn';
import { Compiler } from "inkjs/compiler/Compiler";
import InkStoryType from '../types/InkStoryType';
import RootParserItemType from '../types/parserItems/RootParserItemType';
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



function findChoiceTest(items: RootParserItemType[]): string | undefined {
    for (const item of items) {
        if (typeof item === "string") {
            if (item.startsWith("^")) {
                return item.substring(1)
            }
        }
        else if (item instanceof Array) {
            let res = findChoiceTest(item)
            if (res) {
                return res
            }
        }
    }
}

function getLabel(items: any[], labels: StepLabelJsonType[], subLabels: { [labelId: string]: StepLabelJsonType[] }, choise?: ChoiceMenuOptionsType<{}>) {
    let c: {
        text: string,
        label: string
    } | undefined = undefined
    items.forEach((v) => {
        if (typeof v === "string") {
            if (v.startsWith("^")) {
                labels.push({
                    // remove first character
                    dialog: v.substring(1)
                })
            }
        }
        // is array
        else if (v instanceof Array) {
            if (choise instanceof Array) {
                getLabel(v, labels, subLabels, choise)
            }
            else {
                let choiseInt: ChoiceMenuOptionsType<{}> = []
                getLabel(v, labels, subLabels, choiseInt)
                labels.push({
                    currentChoiceMenuOptions: choiseInt
                })
            }
        }
        // if is object
        else if (typeof v === "object") {
            // if is a choice
            if ("*" in v && typeof v["*"] === "string" && v["*"].includes("c")) {
                let label = "c" + v["*"].split("c")[1]
                if (!c) {
                    c = {
                        text: "",
                        label: ""
                    }
                }
                c.label = label
            }
            // if is choise info
            else if ("s" in v && v["s"] instanceof Array) {
                let text = findChoiceTest(v["s"])
                if (text) {
                    if (!c) {
                        c = {
                            text: "",
                            label: ""
                        }
                    }
                    c.text = text
                }
            }
            else if (choise instanceof Array) {
                addLabels(v, subLabels, choise)
            }
            else {
                let choiseInt: ChoiceMenuOptionsType<{}> = []
                addLabels(v, subLabels, choiseInt)
            }
        }
        else {
            console.log("ignore", v)
        }
    })
    if (c) {
        (choise as any).push(c)
    }
}

function addLabels(item: object, labels: { [labelId: string]: StepLabelJsonType[] }, choise?: ChoiceMenuOptionsType<{}>) {
    if (item === null) {
        return
    }
    // for value and key in item
    for (const [key, value] of Object.entries(item)) {
        // if value is an array
        if (value instanceof Array) {
            let aaaa: StepLabelJsonType[] = []
            let subLabels: { [labelId: string]: StepLabelJsonType[] } = {}
            getLabel(value, aaaa, subLabels, choise)
            if (aaaa.length > 0) {
                labels[key] = aaaa
            }
        }
        else {
            console.log(value)
        }
    }
}

function findLabel(items: RootParserItemType[], labels: { [labelId: string]: StepLabelJsonType[] }) {
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

export function getInkLabel(inkObj: InkStoryType): { [labelId: string]: StepLabelJsonType[] } | undefined {
    try {
        let label: { [labelId: string]: StepLabelJsonType[] } = {}

        findLabel(inkObj.root, label)

        return label;
    } catch (e) {
        console.error("[Pixi'VN Ink] Error parsing ink file", e)
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

    return getInkLabel(obj)
}
