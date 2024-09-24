import { getCharacterById } from "@drincs/pixi-vn";
import { PixiVNJsonConditionalStatements, PixiVNJsonLabelStep, PixiVNJsonStepSwitchElementType, PixiVNJsonValueGet } from "@drincs/pixi-vn-json";
import { StandardDivert } from "../types/parserItems/Divert";
import { MyVariableAssignment } from "../types/parserItems/VariableAssignment";
import { getLabelByStandardDivert } from "../utility/DivertUtility";
import { getText } from "../utility/TextUtility";

export function addSwitchElemenText(list: PixiVNJsonStepSwitchElementType<string>[], item: string | StandardDivert | PixiVNJsonStepSwitchElementType<string> | MyVariableAssignment) {
    if (!item) {
        return
    }
    if (typeof item === "string") {
        if (item.startsWith("^")) {
            list.push(getText(item))
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
    isNewLine: boolean = true,
    isComment: boolean = false
) {
    return addConditionalElementStep(list as any, item as any, labelKey, isNewLine, isComment)
}
function addConditionalElementStep(
    list: PixiVNJsonLabelStep[],
    item: string | PixiVNJsonLabelStep | StandardDivert | PixiVNJsonConditionalStatements<PixiVNJsonLabelStep> | MyVariableAssignment,
    labelKey: string,
    isNewLine: boolean,
    isComment: boolean = false
) {
    if (!item) {
        return
    }
    if (isComment) {
        if (Array.isArray(item)) {
            if (item.length > 0) {
                list.push({
                    operation: [{
                        type: "oprationtoconvert",
                        values: item,
                    }],
                    goNextStep: true,
                })
            }
        }
    }
    else if (typeof item === "string" && item.startsWith("^") ||
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
            list.push(getDialog(getText(item)))
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
                    key: item.name as any,
                }
            })
        }
    }
    else if (typeof item === "string") {
        if (item === "end") {
            list.push({ end: "game_end" })
        }
        else if (item === "done") {
            list.push({
                end: "label_end",
                goNextStep: true,
            })
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
            if (item.params && item.params.length === 0) {
                item.params = undefined
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
                        type: "jump",
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
                        type: "jump",
                        params: item.params,
                    },
                    glueEnabled: glueEnabled,
                })
            }
        }
        if ("typeVar" in item && item.typeOperation === "set") {
            let value = item.value
            if (typeof value === "string" && value.startsWith("^")) {
                value = getText(value)
            }
            list.push({
                goNextStep: true,
                operation: [
                    {
                        type: "value",
                        storageOperationType: "set",
                        storageType: item.typeVar as any,
                        key: item.name as any,
                        value: value,
                    }
                ]
            })
        }
    }
}

function getDialog(text: string): PixiVNJsonLabelStep {
    let character: string | undefined = undefined
    if (text.includes(": ")) {
        let parts = text.split(": ")
        let c = parts[0]
        let t = parts[1]
        if (getCharacterById(c)) {
            character = c
            text = t
        }
    }
    if (character) {
        return {
            dialogue: {
                character: character,
                text: text,
            }
        }
    }
    return {
        dialogue: text
    }
}

type TComment = string | PixiVNJsonValueGet | PixiVNJsonConditionalStatements<string | PixiVNJsonValueGet>
export function addSwitchComment(
    list: PixiVNJsonStepSwitchElementType<TComment>[],
    item: string | TComment | StandardDivert | PixiVNJsonStepSwitchElementType<TComment> | MyVariableAssignment,
    labelKey: string,
    isNewLine: boolean = true,
    isComment: boolean = false
) {
    return addConditionalComment(list as any, item as any, labelKey, isNewLine, isComment)
}
function addConditionalComment(
    list: TComment[],
    item: string | TComment | StandardDivert | PixiVNJsonConditionalStatements<TComment> | MyVariableAssignment,
    _labelKey: string,
    _isNewLine: boolean,
    _isComment: boolean = false
) {
    if (!item) {
        return
    }

    if (typeof item === "string" && item.startsWith("^") ||
        (item && typeof item === "object" && "typeVar" in item && item.typeOperation === "get")
    ) {
        if (typeof item === "string") {
            list.push(getText(item))
        }
        else if (item.typeVar === "logic") {
            list.push({
                type: "value",
                storageType: item.typeVar,
                storageOperationType: "get",
                operation: item.value,
            })
        }
        else if (item.typeVar) {
            list.push({
                type: "value",
                storageType: item.typeVar,
                storageOperationType: "get",
                key: item.name as any,
            })
        }
    }
    else if (typeof item === "object") {
        if ("type" in item) {
            list.push(item as any)
        }
    }
}
