import { PixiVNJsonStepSwitch, PixiVNJsonStepSwitchElementsType, PixiVNJsonStepSwitchElementType } from "@drincs/pixi-vn"
import ControlCommands from "../types/parserItems/ControlCommands"
import { StandardDivert } from "../types/parserItems/Divert"
import NativeFunctions from "../types/parserItems/NativeFunctions"
import RootParserItemType from "../types/parserItems/RootParserItemType"
import TextType from "../types/parserItems/TextType"
import { getConditionalValue } from "./ConditionalStatementsUtility"

type ListItem = StandardDivert | "pop" | TextType | null
type Item = {
    "#f": number,
    [key: string]: ListItem[] | number,
}

export type ConditionalList = (number | ControlCommands | StandardDivert | NativeFunctions | TextType | Item)[]

export function getSwitchValue<T>(
    items: ConditionalList,
    addElement: (list: PixiVNJsonStepSwitchElementType<T>[], item: T | string | StandardDivert | PixiVNJsonStepSwitchElementType<T>, labelKey: string) => void,
    labelKey: string = "",
    nestedId: string | undefined = undefined
): PixiVNJsonStepSwitch<T> {
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
            let isInEnv = false
            let isConditionalText = false
            let conditionalList: RootParserItemType[] = []

            value.forEach((rootItem) => {
                if (Array.isArray(rootItem)) {
                    if (rootItem.includes("visit")) {
                        addElement(itemList, getSwitchValue(rootItem, addElement, labelKey, nestedId), labelKey)
                    } else {
                        if (isConditionalText) {
                            conditionalList.push(rootItem)
                        }
                    }
                    // else if (rootItem.includes("nop")) {
                    //     let i = getConditionalValue(rootItem, addConditionalElement, addElement, labelKey)
                    //     if (i) {
                    //         addElement(itemList, i, labelKey)
                    //     }
                    // }
                    // else {
                    //     console.error("[Pixi’VN Ink] Unhandled case: value is an array", rootItem)
                    // }
                }
                else if (isInEnv) {
                    if (rootItem && typeof rootItem === "object" && "CNT?" in rootItem) {
                        isConditionalText = true
                        conditionalList.push(rootItem)
                    }
                    else {
                        if (rootItem && typeof rootItem === "string" && rootItem === "/ev") {
                            isInEnv = false
                        }
                        conditionalList.push(rootItem)
                    }
                }
                else if (typeof rootItem === "string") {
                    if (rootItem == "ev") {
                        isInEnv = true
                    }
                    else if (rootItem == 'nop' && isConditionalText) {
                        let i = getConditionalValue(conditionalList as any[], addElement, labelKey, nestedId)
                        isConditionalText = false
                        conditionalList = []
                        if (i) {
                            addElement(itemList, i, labelKey)
                        }
                    }
                    else {
                        addElement(itemList, rootItem, labelKey)
                    }
                }
                else if (rootItem && typeof rootItem === "object" && "->" in rootItem && typeof rootItem["->"] === "string") {
                    addElement(itemList, rootItem, labelKey)
                }
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
