import { PixiVNJsonStepSwitch, PixiVNJsonStepSwitchElementsType, PixiVNJsonStepSwitchElementType } from "@drincs/pixi-vn-json"
import { addChoiseIntoList } from "../functions/choice-info-converter"
import InkRootType from "../types/InkRootType"
import { ContainerTypeF } from "../types/parserItems/ContainerType"
import ControlCommands from "../types/parserItems/ControlCommands"
import { StandardDivert } from "../types/parserItems/Divert"
import NativeFunctions from "../types/parserItems/NativeFunctions"
import RootParserItemType from "../types/parserItems/RootParserItemType"
import TextType from "../types/parserItems/TextType"
import { MyVariableAssignment } from "../types/parserItems/VariableAssignment"
import { parseLabel, ShareDataParserLabel } from "./label-parser"

export type ConditionalList = (number | ControlCommands | StandardDivert | NativeFunctions | TextType | ContainerTypeF)[]

export function parserSwitch<T>(
    items: ConditionalList,
    addElement: (
        list: PixiVNJsonStepSwitchElementType<T>[],
        item: T | string | StandardDivert | PixiVNJsonStepSwitchElementType<T> | MyVariableAssignment,
        labelKey: string,
        paramNames: string[],
    ) => void,
    addLabels: (storyItem: InkRootType | RootParserItemType, dadLabelKey: string, shareData: ShareDataParserLabel) => void,
    labelKey: string = "",
    shareData: ShareDataParserLabel,
    paramNames: string[],
    nestedId: string | undefined = undefined
): PixiVNJsonStepSwitch<T> {
    let elements: PixiVNJsonStepSwitchElementsType<T> = []
    let type: "random" | "sequential" | "loop" | "sequentialrandom" = "sequential"
    let min: boolean = false
    let haveFixedEnd: boolean = true

    items.forEach((item) => {
        if (item === "%") {
            type = "loop"
        }
        if (item === "seq") {
            type = "random"
        }
        if (item === "MIN") {
            min = true
        }
        if (typeof item === "number") {
        }
    })

    let lastItem: ContainerTypeF = items[items.length - 1] as ContainerTypeF
    Object.keys(lastItem).forEach((key) => {
        let value = lastItem[key]
        if (Array.isArray(value) && value.length > 3) {
            // remove the first item and the last two
            value = value.slice(1, value.length - 2)
            let itemList: T[] = []

            parseLabel<T>(value, labelKey, shareData, itemList, addElement, addElement, addLabels, addChoiseIntoList, nestedId, true, paramNames)
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
        else if (Array.isArray(value) && value.length === 3) {
            haveFixedEnd = false
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
    if (min && type === "random") {
        let res: PixiVNJsonStepSwitch<T> = {
            type: "stepswitch",
            elements: elements,
            choiceType: "sequentialrandom",
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
