import { getCharacterById } from "@drincs/pixi-vn";
import { PixiVNJsonConditionalStatements, PixiVNJsonLabelStep, PixiVNJsonStepSwitchElementType, PixiVNJsonValueGet } from "@drincs/pixi-vn-json";
import { StandardDivert } from "../types/parserItems/Divert";
import { MyVariableAssignment } from "../types/parserItems/VariableAssignment";
import { getLabelByStandardDivert } from "../utility/divert-utility";
import { getText } from "../utility/text-utility";
import { getValue } from "../utility/value-utility";

export function addSwitchElemenText(list: PixiVNJsonStepSwitchElementType<string>[], item: string | StandardDivert | PixiVNJsonStepSwitchElementType<string> | MyVariableAssignment) {
    if (!item) {
        return
    }
    if (typeof item === "string") {
        if (item.startsWith("^")) {
            list.push(getText(item))
        }
    }
    else if (typeof item === "object" && "type" in item && item.type !== "value") {
        list.push(item)
    }
}

export function addSwitchElemenStep(
    list: PixiVNJsonStepSwitchElementType<PixiVNJsonLabelStep>[],
    item: string | PixiVNJsonLabelStep | StandardDivert | PixiVNJsonStepSwitchElementType<PixiVNJsonLabelStep> | MyVariableAssignment,
    labelKey: string,
    paramNames: string[],
    isNewLine: boolean = true,
    isHashtagScript: boolean = false,
) {
    return addConditionalElementStep(list as any, item as any, labelKey, paramNames, isNewLine, isHashtagScript)
}
function addConditionalElementStep(
    list: PixiVNJsonLabelStep[],
    item: string | PixiVNJsonLabelStep | StandardDivert | PixiVNJsonConditionalStatements<PixiVNJsonLabelStep> | MyVariableAssignment,
    labelKey: string,
    paramNames: string[],
    isNewLine: boolean,
    isHashtagScript: boolean = false,
) {
    if (!item) {
        return
    }
    if (isHashtagScript) {
        if (Array.isArray(item)) {
            if (item.length > 0) {
                list.push({
                    operations: [{
                        type: "operationtoconvert",
                        values: item,
                    }],
                    goNextStep: true,
                })
            }
        }
    }
    else if (typeof item === "string" && item.startsWith("^") ||
        (item && typeof item === "object" && "type" in item && item.type == "value" && item.storageOperationType === "get")
    ) {
        if (!isNewLine && list.length > 0) {
            let prevItem = list[list.length - 1]
            // in this case: <> text
            if (!prevItem.glueEnabled && !prevItem.operations) {
                prevItem.glueEnabled = true
                if (!prevItem.labelToOpen)
                    prevItem.goNextStep = true
            }
            list[list.length - 1] = prevItem
        }
        if (typeof item === "string") {
            list.push(getDialog(getText(item)))
        }
        else {
            list.push({
                dialogue: item
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
                if (!prevItem.labelToOpen)
                    prevItem.goNextStep = true
                list[list.length - 1] = prevItem
            }
            else {
                list.push({
                    glueEnabled: true,
                    goNextStep: false,
                })
            }
        }
    }
    else if (typeof item === "object") {
        if ("type" in item && item.type !== "value") {
            if (!isNewLine && list.length > 0) {
                let prevItem = list[list.length - 1]
                // in this case: <> text
                if (!prevItem.glueEnabled && !prevItem.operations) {
                    prevItem.glueEnabled = true
                    if (!prevItem.labelToOpen)
                        prevItem.goNextStep = true
                }
                list[list.length - 1] = prevItem
            }
            list.push({ conditionalStep: item })
        }
        else if ("->" in item) {
            let glueEnabled = isNewLine ? undefined : true
            if (!isNewLine && list.length > 0) {
                let prevItem = list[list.length - 1]
                if (!prevItem.labelToOpen)
                    prevItem.goNextStep = true
                list[list.length - 1] = prevItem
            }
            if (item.params && item.params.length === 0) {
                item.params = undefined
            }
            if (item.var) {
                list.push({
                    labelToOpen: {
                        label: getValue(item["->"], paramNames),
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
        if ("type" in item && item.type == "value" && item.storageOperationType === "set") {
            if (typeof item.value === "string" && item.value.startsWith("^")) {
                item.value = getText(item.value)
            }
            list.push({
                goNextStep: true,
                operations: [item]
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
    isHashtagScript: boolean = false
) {
    return addConditionalComment(list as any, item as any, labelKey, isNewLine, isHashtagScript)
}
function addConditionalComment(
    list: TComment[],
    item: string | TComment | StandardDivert | PixiVNJsonConditionalStatements<TComment> | MyVariableAssignment,
    _labelKey: string,
    _isNewLine: boolean,
    _isHashtagScript: boolean = false
) {
    if (!item) {
        return
    }

    if (typeof item === "string" && item.startsWith("^") ||
        (item && typeof item === "object" && "type" in item && item.type == "value" && item.storageOperationType === "get")
    ) {
        if (typeof item === "string") {
            list.push(getText(item))
        }
        else {
            list.push(item)
        }
    }
    else if (typeof item === "object") {
        if ("type" in item) {
            list.push(item as any)
        }
    }
}
