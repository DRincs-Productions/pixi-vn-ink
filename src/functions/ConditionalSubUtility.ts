import { PixiVNJsonConditionalStatements, PixiVNJsonLabelStep, PixiVNJsonStepSwitchElementType } from "@drincs/pixi-vn";
import { StandardDivert } from "../types/parserItems/Divert";
import { getLabelByStandardDivert } from "./DivertUtility";

export function addConditionalElementText(list: (string | PixiVNJsonConditionalStatements<string>)[], item: string | StandardDivert | PixiVNJsonConditionalStatements<string>) {
    if (!item) {
        return
    }
    if (typeof item === "string") {
        if (item.startsWith("^")) {
            list.push(item.substring(1))
        }
    }
    else if (typeof item === "object" && "type" in item) {
        list.push(item)
    }
}

export function addSwitchElemenText(list: PixiVNJsonStepSwitchElementType<string>[], item: string | StandardDivert | PixiVNJsonStepSwitchElementType<string>) {
    if (!item) {
        return
    }
    if (typeof item === "string") {
        if (item.startsWith("^")) {
            list.push(item.substring(1))
        }
    }
    else if (typeof item === "object" && "type" in item) {
        list.push(item)
    }
}

function addConditionalElementStep(
    list: (PixiVNJsonLabelStep | PixiVNJsonConditionalStatements<PixiVNJsonLabelStep>)[],
    item: string | PixiVNJsonLabelStep | StandardDivert | PixiVNJsonConditionalStatements<PixiVNJsonLabelStep>,
    labelKey: string,
    isNewLine: boolean
) {
    if (!item) {
        return
    }
    if (typeof item === "string") {
        if (item.startsWith("^")) {
            if (!isNewLine && list.length > 0) {
                let prevItem = list[list.length - 1]
                if (typeof prevItem === "object" && "type" in prevItem) {
                    prevItem = {
                        conditionalStep: prevItem,
                    }
                }
                // in this case: <> text
                if (!prevItem.glueEnabled) {
                    prevItem.glueEnabled = true
                    prevItem.goNextStep = true
                }
                list[list.length - 1] = prevItem
            }
            list.push({ dialogue: item.substring(1) })
        }
        else if (item === "end") {
            list.push({ end: "game_end" })
        }
        else if (item === "done") {
            list.push({ end: "label_end" })
        }
        else if (item == "<>") {
            if (list.length > 0) {
                let prevItem = list[list.length - 1]
                if (typeof prevItem === "object" && "type" in prevItem) {
                    prevItem = {
                        conditionalStep: prevItem,
                    }
                }
                prevItem.glueEnabled = true
                prevItem.goNextStep = true
                list[list.length - 1] = prevItem
            }
            else {
                list.push({
                    glueEnabled: true,
                    goNextStep: true,
                })
            }
        }
    }
    else if (typeof item === "object" && "type" in item) {
        list.push(item)
    }
    else if (typeof item === "object" && "->" in item) {
        let glueEnabled = isNewLine ? undefined : true
        let labelIdToOpen = getLabelByStandardDivert(item["->"], labelKey)
        if (!isNewLine && list.length > 0) {
            let prevItem = list[list.length - 1]
            if (typeof prevItem === "object" && "type" in prevItem) {
                prevItem = {
                    conditionalStep: prevItem,
                }
            }
            prevItem.goNextStep = true
            list[list.length - 1] = prevItem
        }
        list.push({
            labelToOpen: {
                label: labelIdToOpen,
                type: "call",
            },
            glueEnabled: glueEnabled,
        })
    }
}

export function addSwitchElemenStep(
    list: PixiVNJsonStepSwitchElementType<PixiVNJsonLabelStep>[],
    item: string | PixiVNJsonLabelStep | StandardDivert | PixiVNJsonStepSwitchElementType<PixiVNJsonLabelStep>,
    labelKey: string,
    isNewLine: boolean = true
) {
    return addConditionalElementStep(list as any, item as any, labelKey, isNewLine)
}
