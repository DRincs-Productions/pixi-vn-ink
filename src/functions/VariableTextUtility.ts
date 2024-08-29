import { PixiVNJsonConditionalStatements, PixiVNJsonStepSwitch, PixiVNJsonStepSwitchElementsType, PixiVNJsonStepSwitchElementType } from "@drincs/pixi-vn"
import ControlCommands from "../types/parserItems/ControlCommands"
import { StandardDivert } from "../types/parserItems/Divert"
import NativeFunctions from "../types/parserItems/NativeFunctions"
import TextType from "../types/parserItems/TextType"
import { getConditionalValue } from "./ConditionalUtility"

type ListItem = StandardDivert | "pop" | TextType | null
type Item = {
    "#f": number,
    [key: string]: ListItem[] | number,
}

export type ConditionalList = (number | ControlCommands | StandardDivert | NativeFunctions | TextType | Item)[]

export function getVariableValue<T>(
    items: ConditionalList,
    addElement: (list: PixiVNJsonStepSwitchElementType<T>[], item: T | string | StandardDivert | PixiVNJsonStepSwitchElementType<T>, labelKey: string) => void,
    addConditionalElement: (list: (T | PixiVNJsonConditionalStatements<T>)[], item: T | string | StandardDivert | PixiVNJsonConditionalStatements<T>, labelKey: string) => void,
    labelKey: string = "",
    nestedId: string | undefined = undefined
): PixiVNJsonStepSwitch<T> {
    return getVariableItem<T>((v, itemList) => {
        if (typeof v === "string") {
            addElement(itemList, v, labelKey)
        }
        else if (Array.isArray(v)) {
            if (v.includes("visit")) {
                addElement(itemList, getVariableValue(v, addElement, addConditionalElement, labelKey, nestedId), labelKey)
            }
            else if (v.includes("nop")) {
                let i = getConditionalValue(v, addConditionalElement, addElement, labelKey)
                if (i) {
                    addElement(itemList, i, labelKey)
                }
            }
            else {
                console.error("[Pixi’VN Ink] Unhandled case: value is an array", v)
            }
        }
        else if (v && typeof v === "object" && "->" in v && typeof v["->"] === "string") {
            addElement(itemList, v, labelKey)
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
