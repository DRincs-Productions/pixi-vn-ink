import { PixiVNJsonConditionalStatements, PixiVNJsonLabelStep, PixiVNJsonStepSwitch } from "@drincs/pixi-vn"
import ControlCommands from "../types/parserItems/ControlCommands"
import { StandardDivert } from "../types/parserItems/Divert"
import NativeFunctions from "../types/parserItems/NativeFunctions"
import TextType from "../types/parserItems/TextType"
import { getLabelByStandardDivert } from "./DivertUtility"

type ListItem = StandardDivert | "pop" | TextType | null
type Item = {
    "#f": number,
    [key: string]: ListItem[] | number,
}

export type ConditionalList = (number | ControlCommands | StandardDivert | NativeFunctions | TextType | Item)[]

export function getVariableStep(items: ConditionalList, labelKey: string = "", nestedId: string | undefined = undefined): PixiVNJsonStepSwitch<PixiVNJsonLabelStep[] | PixiVNJsonLabelStep> {
    let elements: (PixiVNJsonLabelStep[] | PixiVNJsonLabelStep)[] = []
    let type: "random" | "sequential" | "loop" = "sequential"
    let haveFixedEnd: boolean = true

    items.forEach((item) => {
        if (item === "%") {
            type = "loop"
        }
        if (item === "du") {
            haveFixedEnd = false
        }
        if (item === "seq") {
            type = "random"
        }
        if (item === "env") {
            haveFixedEnd = true
        }
    })

    let lastItem: Item = items[items.length - 1] as Item
    Object.keys(lastItem).forEach((key) => {
        let value = lastItem[key]
        if (Array.isArray(value) && value.length > 3) {
            // remove the first item and the last two
            value = value.slice(1, value.length - 2)
            let itemList: PixiVNJsonLabelStep[] = []
            value.forEach((v) => {
                let item: PixiVNJsonLabelStep = {}
                if (typeof v === "string" && v.startsWith("^")) {
                    item.dialogue = v.substring(1)
                }
                else if (Array.isArray(v)) {
                    if (v.includes("visit")) {
                        item.conditionalStep = getVariableStep(v, labelKey, nestedId)
                    }
                    else {
                        console.error("[Pixi’VN Ink] Unhandled case: value is an array", v)
                    }
                }
                else if (v && typeof v === "object" && "->" in v && typeof v["->"] === "string") {
                    let label = getLabelByStandardDivert(v["->"], labelKey)
                    item.labelToOpen = {
                        label: label,
                        type: "call",
                    }
                }
                else if (typeof v === "string" && v === "end") {
                    item.end = "game_end"
                }
                else if (typeof v === "string" && v === "done") {
                    item.end = "label_end"
                }
                itemList.push(item)
            })
            if (itemList.length === 1) {
                elements.push(itemList[0])
            }
            else {
                elements.push(itemList)
            }
        }
        else {
            console.error("[Pixi’VN Ink] Unhandled case: value is not an array", value)
        }
    })

    if (type === "sequential") {
        let res: PixiVNJsonStepSwitch<PixiVNJsonLabelStep[] | PixiVNJsonLabelStep> = {
            type: "stepswitch",
            elements: elements,
            choiceType: type,
            end: haveFixedEnd ? "lastItem" : undefined,
            nestedId: nestedId,
        }
        return res
    }
    let res: PixiVNJsonStepSwitch<PixiVNJsonLabelStep[] | PixiVNJsonLabelStep> = {
        type: "stepswitch",
        elements: elements,
        choiceType: type,
    }
    return res
}

export type VariableChoiseText = {
    text?: string | string[];
    conditionalChoice?: PixiVNJsonConditionalStatements<VariableChoiseText[] | VariableChoiseText>;
};

export function getVariableChoise(items: ConditionalList, labelKey: string = "", nestedId: string | undefined = undefined): PixiVNJsonStepSwitch<VariableChoiseText[] | VariableChoiseText> {
    let elements: (VariableChoiseText | VariableChoiseText[])[] = []
    let type: "random" | "sequential" | "loop" = "sequential"
    let haveFixedEnd: boolean = true

    items.forEach((item) => {
        if (item === "%") {
            type = "loop"
        }
        if (item === "du") {
            haveFixedEnd = false
        }
        if (item === "seq") {
            type = "random"
        }
        if (item === "env") {
            haveFixedEnd = true
        }
        if (typeof item === "number") {
        }
    })

    let lastItem: Item = items[items.length - 1] as Item
    Object.keys(lastItem).forEach((key) => {
        let value = lastItem[key]
        if (Array.isArray(value) && value.length > 3) {
            // remove the first item and the last two
            value = value.slice(1, value.length - 2)
            let itemList: VariableChoiseText[] = []
            value.forEach((v) => {
                let item: VariableChoiseText = {}
                if (typeof v === "string" && v.startsWith("^")) {
                    item.text = v.substring(1)
                }
                else if (Array.isArray(v)) {
                    if (v.includes("visit")) {
                        item.conditionalChoice = getVariableChoise(v, labelKey, nestedId)
                    }
                    else {
                        console.error("[Pixi’VN Ink] Unhandled case: value is an array", v)
                    }
                }
                itemList.push(item)
            })
            if (itemList.length === 1) {
                elements.push(itemList[0])
            }
            else {
                elements.push(itemList)
            }
        }
        else {
            console.error("[Pixi’VN Ink] Unhandled case: value is not an array", value)
        }
    })

    if (type === "sequential") {
        let res: PixiVNJsonStepSwitch<VariableChoiseText[] | VariableChoiseText> = {
            type: "stepswitch",
            elements: elements,
            choiceType: type,
            end: haveFixedEnd ? "lastItem" : undefined,
            nestedId: nestedId,
        }
        return res
    }
    let res: PixiVNJsonStepSwitch<VariableChoiseText[] | VariableChoiseText> = {
        type: "stepswitch",
        elements: elements,
        choiceType: type,
    }
    return res
}
