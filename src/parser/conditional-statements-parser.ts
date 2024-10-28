import { PixiVNJsonConditionalResultToCombine, PixiVNJsonConditionalStatements, PixiVNJsonStepSwitchElementType } from "@drincs/pixi-vn-json";
import { CHOISE_LABEL_KEY_SEPARATOR } from "../constant";
import { addChoiseIntoList } from "../functions/choice-info-converter";
import InkRootType from "../types/InkRootType";
import Cond from "../types/parserItems/Cond";
import { StandardDivert } from "../types/parserItems/Divert";
import NativeFunctions from "../types/parserItems/NativeFunctions";
import ReadCount from "../types/parserItems/ReadCount";
import RootParserItemType from "../types/parserItems/RootParserItemType";
import { MyVariableAssignment } from "../types/parserItems/VariableAssignment";
import { conditionaAritmeticParser } from "./conditiona-aritmetic-parser";
import { parseLabel, ShareDataParserLabel } from "./label-parser";

export function parserConditionalStatements<T>(
    then: T | PixiVNJsonConditionalStatements<T> | PixiVNJsonConditionalResultToCombine<T>,
    data: (ReadCount | NativeFunctions)[],
    paramNames: string[],
    labelKey: string,
    elseThen?: T | PixiVNJsonConditionalStatements<T> | PixiVNJsonConditionalResultToCombine<T>
): undefined | PixiVNJsonConditionalStatements<T> {
    if (data.length === 0) {
        return undefined
    }
    let conditions = conditionaAritmeticParser(data, labelKey, paramNames)
    if (conditions.length === 1) {
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
    else if (conditions.length > 1) {
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
    addSwitchElemen: (
        list: PixiVNJsonStepSwitchElementType<T>[],
        item: T | string | StandardDivert | PixiVNJsonStepSwitchElementType<T> | MyVariableAssignment,
        labelKey: string,
        paramNames: string[],
    ) => void,
    addLabels: (storyItem: InkRootType | RootParserItemType, dadLabelKey: string, shareData: ShareDataParserLabel) => void,
    labelKey: string,
    shareData: ShareDataParserLabel,
    paramNames: string[],
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

    let then = getThen(data[0] as any, addSwitchElemen, addLabels, labelKey + CHOISE_LABEL_KEY_SEPARATOR + "then", shareData, paramNames, `${nestedId || ""}then`)
    let elseThen = undefined
    if (data.length === 2) {
        elseThen = getThen(data[1] as any, addSwitchElemen, addLabels, labelKey + CHOISE_LABEL_KEY_SEPARATOR + "else", shareData, paramNames, `${nestedId || ""}else`)
    }
    else if (data.length > 2) {
        data.shift()
        data.push("nop" as any)
        data = [
            { "b": data } as any
        ]
        elseThen = getThen(data as any, addSwitchElemen, addLabels, labelKey + CHOISE_LABEL_KEY_SEPARATOR + "else", shareData, paramNames, `${nestedId || ""}else`)
    }
    shareData.du = undefined
    return parserConditionalStatements<T>(then, condition, paramNames, labelKey, elseThen)
}

function getThen<T>(
    cond: (StandardDivert | Cond)[],
    addSwitchElemen: (
        list: PixiVNJsonStepSwitchElementType<T>[],
        item: T | string | StandardDivert | PixiVNJsonStepSwitchElementType<T> | MyVariableAssignment,
        labelKey: string,
        paramNames: string[],
    ) => void,
    addLabels: (storyItem: InkRootType | RootParserItemType, dadLabelKey: string, shareData: ShareDataParserLabel) => void,
    labelKey: string,
    shareData: ShareDataParserLabel,
    paramNames: string[],
    nestedId: string | undefined = undefined
): PixiVNJsonConditionalResultToCombine<T> | T | PixiVNJsonConditionalStatements<T> {
    let res: T[] = []

    for (const item of cond) {
        if (typeof item === "object" && "b" in item) {
            item.b = item.b.filter((item) => item !== null && !(
                typeof item === "object" && "->" in item && (new RegExp(/.*\.[0-9]/)).test(item["->"])
            ))
            parseLabel<T>(item.b, labelKey, shareData, res, addSwitchElemen, addSwitchElemen, addLabels, addChoiseIntoList, nestedId, true, paramNames)
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