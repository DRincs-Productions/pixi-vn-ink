import { PixiVNJsonConditionalResultToCombine, PixiVNJsonConditionalStatements, PixiVNJsonStepSwitchElementType } from "@drincs/pixi-vn";
import { addChoiseIntoList } from "../functions/ChoiceInfoConverter";
import InkRootType from "../types/InkRootType";
import Cond from "../types/parserItems/Cond";
import { StandardDivert } from "../types/parserItems/Divert";
import NativeFunctions from "../types/parserItems/NativeFunctions";
import ReadCount from "../types/parserItems/ReadCount";
import RootParserItemType from "../types/parserItems/RootParserItemType";
import { MyVariableAssignment } from "../types/parserItems/VariableAssignment";
import { conditionaAritmeticParser } from "./ConditionaAritmeticParser";
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
    let conditions = conditionaAritmeticParser(data, labelKey)
    if (conditions.length === 0) {
        console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
    }
    else if (conditions.length === 1) {
        let res: PixiVNJsonConditionalStatements<T> = {
            type: "ifelse",
            condition: conditions[0],
            then: then,
            else: elseThen
        }
        if (!res.else) {
            delete res.else
        }
        return res
    }
    else {
        let res: PixiVNJsonConditionalStatements<T> = {
            type: "ifelse",
            condition: {
                type: "union",
                unionType: "and",
                conditions: conditions
            },
            then: then,
            else: elseThen
        }
        if (!res.else) {
            delete res.else
        }
        return res
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
        else if (typeof item === "string" && item === "du") {
            if (shareData.du) {
                condition.push(shareData.du)
            }
            else {
                shareData.du = condition[condition.length - 1]
            }
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
    let elseThen = undefined
    if (data.length === 2) {
        elseThen = getThen(data[1] as any, addSwitchElemen, addLabels, labelKey, shareData, nestedId)
    }
    else if (data.length > 2) {
        data.shift()
        data.push("nop" as any)
        data = [
            { "b": data } as any
        ]
        elseThen = getThen(data as any, addSwitchElemen, addLabels, labelKey, shareData, nestedId)
    }
    shareData.du = undefined
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
            if (item.b.length > 2 && item.b[item.b.length - 1] !== "nop") {
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