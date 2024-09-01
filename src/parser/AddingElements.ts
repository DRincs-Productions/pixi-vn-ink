import { PixiVNJsonConditionalStatements, PixiVNJsonLabelStep, PixiVNJsonStepSwitchElementType } from "@drincs/pixi-vn";
import { StandardDivert } from "../types/parserItems/Divert";
import { getLabelByStandardDivert } from "../utility/DivertUtility";

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

export function addSwitchElemenStep(
    list: PixiVNJsonStepSwitchElementType<PixiVNJsonLabelStep>[],
    item: string | PixiVNJsonLabelStep | StandardDivert | PixiVNJsonStepSwitchElementType<PixiVNJsonLabelStep>,
    labelKey: string,
    isNewLine: boolean = true
) {
    return addConditionalElementStep(list as any, item as any, labelKey, isNewLine)
}
function addConditionalElementStep(
    list: PixiVNJsonLabelStep[],
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
        list.push({ conditionalStep: item })
    }
    else if (typeof item === "object" && "->" in item) {
        let glueEnabled = isNewLine ? undefined : true
        let labelIdToOpen = getLabelByStandardDivert(item["->"], labelKey)
        if (!isNewLine && list.length > 0) {
            let prevItem = list[list.length - 1]
            prevItem.goNextStep = true
            list[list.length - 1] = prevItem
        }
        list.push({
            labelToOpen: {
                label: getLabelByStandardDivert(labelIdToOpen, labelKey),
                type: "call",
            },
            glueEnabled: glueEnabled,
        })
    }
}
