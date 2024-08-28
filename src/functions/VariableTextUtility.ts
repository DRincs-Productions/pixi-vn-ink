import { PixiVNJsonConditionalStatements, PixiVNJsonLabelStep, PixiVNJsonStepSwitch, PixiVNJsonStepSwitchElementsType, PixiVNJsonStepSwitchElementType } from "@drincs/pixi-vn"
import ControlCommands from "../types/parserItems/ControlCommands"
import { StandardDivert } from "../types/parserItems/Divert"
import NativeFunctions from "../types/parserItems/NativeFunctions"
import TextType from "../types/parserItems/TextType"
import { getConditionalValue } from "./ConditionalUtility"
import { getLabelByStandardDivert } from "./DivertUtility"



type ListItem = StandardDivert | "pop" | TextType | null
type Item = {
    "#f": number,
    [key: string]: ListItem[] | number,
}

export type ConditionalList = (number | ControlCommands | StandardDivert | NativeFunctions | TextType | Item)[]

export function getVariableStep(items: ConditionalList, labelKey: string = "", nestedId: string | undefined = undefined): PixiVNJsonStepSwitch<PixiVNJsonLabelStep[] | PixiVNJsonLabelStep> {
    return getVariableItem((v, itemList) => {
        let item: PixiVNJsonLabelStep = {}
        if (typeof v === "string" && v.startsWith("^")) {
            item.dialogue = v.substring(1)
        }
        else if (Array.isArray(v)) {
            if (v.includes("visit")) {
                item.conditionalStep = getVariableStep(v, labelKey, nestedId)
            }
            else if (v.includes("nop")) {
                let i = getConditionalValue(v, labelKey)
                if (i) {
                    item.dialogue = i
                }
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
    }, items, labelKey, nestedId)
}

export function getVariableValue<T>(
    items: ConditionalList,
    addElement: (list: (T | PixiVNJsonStepSwitchElementType<T>)[], item: T | string | PixiVNJsonConditionalStatements<T>) => void,
    labelKey: string = "",
    nestedId: string | undefined = undefined
): PixiVNJsonStepSwitch<T> {
    return getVariableItem<T>((v, itemList) => {
        let item: PixiVNJsonStepSwitchElementsType<T> | undefined = undefined
        if (typeof v === "string" && v.startsWith("^")) {
            addElement(itemList, v.substring(1))
        }
        else if (Array.isArray(v)) {
            if (v.includes("visit")) {
                addElement(itemList, getVariableValue(v, addElement, labelKey, nestedId))
            }
            else if (v.includes("nop")) {
                let i = getConditionalValue(v, addElement, labelKey)
                if (i) {
                    addElement(itemList, i)
                }
            }
            else {
                console.error("[Pixi’VN Ink] Unhandled case: value is an array", v)
            }
        }
        if (item) {
            addElement(itemList, item)
        }
    }, items, labelKey, nestedId)
}

function getVariableItem<T>(addList: (item: ListItem, list: PixiVNJsonStepSwitchElementType<T>[]) => void, items: ConditionalList, _labelKey: string = "", nestedId: string | undefined = undefined): PixiVNJsonStepSwitch<T> {
    let elements: PixiVNJsonStepSwitchElementsType<T> = []
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
            let itemList: PixiVNJsonStepSwitchElementType<T>[] = []
            value.forEach((v) => {
                addList(v, itemList)
            })
            if (itemList.length === 1) {
                elements.push(itemList[0])
            }
            else {
                elements.push({
                    type: "resulttocombine",
                    combine: "cross",
                    secondConditionalItem: itemList
                })
            }
        }
        else {
            console.error("[Pixi’VN Ink] Unhandled case: value is not an array", value)
        }
    })

    if (type === "sequential") {
        let res: PixiVNJsonStepSwitch<T> = {
            type: "stepswitch",
            elements: elements,
            choiceType: type,
            end: haveFixedEnd ? "lastItem" : undefined,
            nestedId: nestedId,
        }
        return res
    }
    let res: PixiVNJsonStepSwitch<T> = {
        type: "stepswitch",
        elements: elements,
        choiceType: type,
    }
    return res
}
