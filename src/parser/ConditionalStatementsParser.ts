import { PixiVNJsonConditionalResultToCombine, PixiVNJsonConditionalStatements, PixiVNJsonConditions, PixiVNJsonStepSwitchElementType } from "@drincs/pixi-vn";
import { CHOISE_LABEL_KEY_SEPARATOR } from "../constant";
import { addChoiseIntoList } from "../functions/ChoiceInfoConverter";
import InkRootType from "../types/InkRootType";
import Cond from "../types/parserItems/Cond";
import { StandardDivert } from "../types/parserItems/Divert";
import NativeFunctions from "../types/parserItems/NativeFunctions";
import ReadCount from "../types/parserItems/ReadCount";
import RootParserItemType from "../types/parserItems/RootParserItemType";
import { MyVariableAssignment } from "../types/parserItems/VariableAssignment";
import { getLabelByStandardDivert } from "../utility/DivertUtility";
import { parseLabel, ShareDataParserLabel } from "./LabelParser";

export function parserConditionalStatements<T>(
    then: T | PixiVNJsonConditionalStatements<T> | PixiVNJsonConditionalResultToCombine<T>,
    data: (ReadCount | NativeFunctions)[],
    labelKey: string,
    elseThen?: T | PixiVNJsonConditionalStatements<T> | PixiVNJsonConditionalResultToCombine<T>
): undefined | PixiVNJsonConditionalStatements<T> {
    if (data.length === 0) {
        console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
        return undefined
    }
    let conditions: PixiVNJsonConditions[] = []
    data.forEach((item) => {
        if (typeof item === "object" && "CNT?" in item) {
            if ((new RegExp(/.*\.[0-9]\..*/)).test(item["CNT?"])) {
                let items = item["CNT?"].split(".")
                // remove the last element
                let end = items.pop()
                let stringNumber = items.pop()
                if (stringNumber === undefined || end === undefined) {
                    console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
                    return
                }
                let number = parseInt(stringNumber)
                let label = items.join(".")
                if (label.includes("^.")) {
                    let labelArray = label.split(".")
                    let end2 = labelArray[labelArray.length - 1].replace(".", CHOISE_LABEL_KEY_SEPARATOR)
                    labelArray.pop()
                    label = labelArray.join(".") + "." + end2
                    if (end.includes("c-")) {
                        label = label + CHOISE_LABEL_KEY_SEPARATOR + end
                    }
                }
                else {
                    label = label.replace(".", CHOISE_LABEL_KEY_SEPARATOR)
                }
                conditions.push({
                    type: "compare",
                    leftValue: {
                        type: "value",
                        storageType: "label",
                        storageOperationType: "get",
                        valueType: "biggeststep",
                        label: getLabelByStandardDivert(label, labelKey),
                    },
                    operator: ">=",
                    rightValue: {
                        type: "value",
                        value: number,
                    },
                })
            }
            else {
                conditions.push({
                    type: "value",
                    storageType: "label",
                    storageOperationType: "get",
                    label: getLabelByStandardDivert(item["CNT?"], labelKey),
                })
            }
        }
        else if (item === "&&" || item === "||") {
            if (conditions.length < 2) {
                console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
            }
            else {
                let i: PixiVNJsonConditions = {
                    type: "union",
                    unionType: item === "&&" ? "and" : "or",
                    conditions: [
                        conditions[conditions.length - 2],
                        conditions[conditions.length - 1]
                    ]
                }
                // remove last two elements
                conditions.pop()
                conditions.pop()
                conditions.push(i)
            }
        }
        else if (item === "!") {
            if (conditions.length === 0) {
                console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
            }
            else {
                let i: PixiVNJsonConditions = {
                    type: "union",
                    unionType: "not",
                    condition: conditions[conditions.length - 1]
                }
                conditions[conditions.length - 1] = i
            }
        }
        else if (item === "==" || item === "!=" || item === "<" || item === "<=" || item === ">" || item === ">=") {
            if (conditions.length < 2) {
                console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
            }
            else {
                let i: PixiVNJsonConditions = {
                    type: "compare",
                    operator: item,
                    leftValue: conditions[conditions.length - 1],
                    rightValue: conditions[conditions.length - 2]
                }
                // remove last two elements
                conditions.pop()
                conditions.pop()
                conditions.push(i)
            }
        }
        else {
            conditions.push(item)
        }
    })
    if (conditions.length === 0) {
        console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
    }
    else if (conditions.length === 1) {
        return {
            type: "ifelse",
            condition: conditions[0],
            then: then,
            else: elseThen
        }
    }
    else {
        return {
            type: "ifelse",
            condition: {
                type: "union",
                unionType: "and",
                conditions: conditions
            },
            then: then,
            else: elseThen
        }
    }
}

export function getConditionalValue<T>(
    preData: (ReadCount | (StandardDivert | Cond)[])[],
    addSwitchElemen: (list: PixiVNJsonStepSwitchElementType<T>[], item: T | string | StandardDivert | PixiVNJsonStepSwitchElementType<T> | MyVariableAssignment, labelKey: string) => void,
    addLabels: (storyItem: InkRootType | RootParserItemType, dadLabelKey: string, shareData: ShareDataParserLabel) => void,
    labelKey: string,
    shareData: ShareDataParserLabel,
    nestedId: string | undefined = undefined
): PixiVNJsonConditionalStatements<T> | undefined {
    if (preData.length === 0) {
        console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", preData)
        return undefined
    }
    let condition: (ReadCount | NativeFunctions)[] = []
    let data: ((StandardDivert | Cond)[])[] = []
    // split the data
    preData.forEach((item) => {
        if (Array.isArray(item)) {
            data.push(item)
        }
        else if (typeof item !== "string" || item !== "/ev") {
            condition.push(item)
        }
    })

    if (data.length === 0) {
        console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
        return undefined
    }

    let then = getThen(data[0] as any, addSwitchElemen, addLabels, labelKey, shareData, nestedId)
    let elseThen = data.length > 1 ? getThen(data[1] as any, addSwitchElemen, addLabels, labelKey, shareData, nestedId) : undefined
    return parserConditionalStatements<T>(then, condition, labelKey, elseThen)
}

function getThen<T>(
    cond: (StandardDivert | Cond)[],
    addSwitchElemen: (list: PixiVNJsonStepSwitchElementType<T>[], item: T | string | StandardDivert | PixiVNJsonStepSwitchElementType<T> | MyVariableAssignment, labelKey: string) => void,
    addLabels: (storyItem: InkRootType | RootParserItemType, dadLabelKey: string, shareData: ShareDataParserLabel) => void,
    labelKey: string,
    shareData: ShareDataParserLabel,
    nestedId: string | undefined = undefined
): PixiVNJsonConditionalResultToCombine<T> | T | PixiVNJsonConditionalStatements<T> {
    let res: T[] = []

    for (const item of cond) {
        if (typeof item === "object" && "b" in item) {
            if (item.b.length > 2) {
                // remove the last 2 items
                item.b.pop()
                item.b.pop()
            }
            parseLabel<T>(item.b, labelKey, shareData, res, addSwitchElemen, addSwitchElemen, addLabels, addChoiseIntoList, nestedId)
        }
    }
    if (res.length === 1) {
        return res[0]
    }
    let combinateRes: PixiVNJsonConditionalResultToCombine<T> = {
        type: "resulttocombine",
        combine: "cross",
        secondConditionalItem: res,
    }
    return combinateRes
}