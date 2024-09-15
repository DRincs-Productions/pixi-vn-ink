import { PixiVNJsonConditionalStatements, PixiVNJsonLabelStep, PixiVNJsonStepSwitchElementType } from "@drincs/pixi-vn";
import { StandardDivert } from "../types/parserItems/Divert";
import { MyVariableAssignment } from "../types/parserItems/VariableAssignment";
import { getLabelByStandardDivert } from "../utility/DivertUtility";

export function addSwitchElemenText(list: PixiVNJsonStepSwitchElementType<string>[], item: string | StandardDivert | PixiVNJsonStepSwitchElementType<string> | MyVariableAssignment) {
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
    item: string | PixiVNJsonLabelStep | StandardDivert | PixiVNJsonStepSwitchElementType<PixiVNJsonLabelStep> | MyVariableAssignment,
    labelKey: string,
    isNewLine: boolean = true
) {
    return addConditionalElementStep(list as any, item as any, labelKey, isNewLine)
}
function addConditionalElementStep(
    list: PixiVNJsonLabelStep[],
    item: string | PixiVNJsonLabelStep | StandardDivert | PixiVNJsonConditionalStatements<PixiVNJsonLabelStep> | MyVariableAssignment,
    labelKey: string,
    isNewLine: boolean
) {
    if (!item) {
        return
    }
    if (typeof item === "string" && item.startsWith("^") ||
        (item && typeof item === "object" && "typeVar" in item && item.typeOperation === "get")
    ) {
        if (!isNewLine && list.length > 0) {
            let prevItem = list[list.length - 1]
            // in this case: <> text
            if (!prevItem.glueEnabled) {
                prevItem.glueEnabled = true
                prevItem.goNextStep = true
            }
            list[list.length - 1] = prevItem
        }
        if (typeof item === "string") {
            list.push({ dialogue: item.substring(1) })
        }
        else if (item.typeVar === "logic") {
            list.push({
                dialogue: {
                    type: "value",
                    storageType: item.typeVar,
                    storageOperationType: "get",
                    operation: item.value,
                }
            })
        }
        else if (item.typeVar) {
            list.push({
                dialogue: {
                    type: "value",
                    storageType: item.typeVar,
                    storageOperationType: "get",
                    key: item.name,
                }
            })
        }
    }
    else if (typeof item === "string") {
        if (item === "end") {
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
    else if (typeof item === "object") {
        if ("type" in item) {
            list.push({ conditionalStep: item })
        }
        else if ("->" in item) {
            let glueEnabled = isNewLine ? undefined : true
            if (!isNewLine && list.length > 0) {
                let prevItem = list[list.length - 1]
                prevItem.goNextStep = true
                list[list.length - 1] = prevItem
            }
            if (item.var) {
                list.push({
                    labelToOpen: {
                        label: {
                            type: "value",
                            storageOperationType: "get",
                            storageType: "storage", // TODO: check if it's correct
                            key: item["->"],
                        },
                        type: "call",
                        params: item.params,
                    },
                    glueEnabled: glueEnabled,
                })
            }
            else {
                let labelIdToOpen = getLabelByStandardDivert(item["->"], labelKey)
                list.push({
                    labelToOpen: {
                        label: labelIdToOpen,
                        type: "call",
                        params: item.params,
                    },
                    glueEnabled: glueEnabled,
                })
            }
        }
        if ("typeVar" in item && item.typeOperation === "set") {
            let value = item.value
            if (typeof value === "string" && value.startsWith("^")) {
                value = value.substring(1)
            }
            list.push({
                goNextStep: true,
                operation: [
                    {
                        type: "value",
                        storageOperationType: "set",
                        storageType: item.typeVar,
                        key: item.name,
                        value: value,
                    }
                ]
            })
        }
    }
}
