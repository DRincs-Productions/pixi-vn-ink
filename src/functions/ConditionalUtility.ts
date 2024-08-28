import { PixiVNJsonConditionalResultToCombine, PixiVNJsonConditionalStatements, PixiVNJsonConditions, PixiVNJsonStepSwitchElementType } from "@drincs/pixi-vn";
import Cond from "../types/parserItems/Cond";
import { StandardDivert } from "../types/parserItems/Divert";
import NativeFunctions from "../types/parserItems/NativeFunctions";
import ReadCount from "../types/parserItems/ReadCount";
import RootParserItemType from "../types/parserItems/RootParserItemType";
import { getLabelByStandardDivert } from "./DivertUtility";
import { getVariableValue } from "./VariableTextUtility";

export function getConditionalChoice<T>(then: T | PixiVNJsonConditionalStatements<T>, data: (ReadCount | NativeFunctions)[], labelKey: string, elseThen?: T | PixiVNJsonConditionalStatements<T>): T | PixiVNJsonConditionalStatements<T> {
    if (data.length > 0) {
        let conditions: PixiVNJsonConditions[] = []
        data.forEach((item) => {
            if (typeof item === "object" && "CNT?" in item) {
                conditions.push({
                    type: "value",
                    storageType: "label",
                    storageOperationType: "get",
                    label: getLabelByStandardDivert(item["CNT?"], labelKey),
                })
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
    return then
}

export function getConditionalValue<T>(
    data: (ReadCount | (StandardDivert | Cond)[])[],
    addElement: (list: (T | PixiVNJsonConditionalStatements<T>)[], item: T | string | PixiVNJsonConditionalStatements<T>) => void,
    addSwitchElemen: (list: PixiVNJsonStepSwitchElementType<T>[], item: T | string | StandardDivert | PixiVNJsonConditionalStatements<T>) => void,
    labelKey: string,
    nestedId: string | undefined = undefined
): PixiVNJsonConditionalStatements<T> | undefined {
    if (data.length === 0) {
        console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
        return undefined
    }
    let condition: ReadCount | undefined = undefined
    if (typeof data[0] === "object" && "CNT?" in data[0]) {
        condition = data[0] as ReadCount
    }
    if (data.length === 2 && condition) {
        let then = getThen(data[1] as any, addElement, addSwitchElemen, labelKey, nestedId)
        return {
            type: "ifelse",
            condition: {
                type: "value",
                storageType: "label",
                storageOperationType: "get",
                label: getLabelByStandardDivert(getLabelByStandardDivert(condition["CNT?"], labelKey), labelKey),
            },
            then: then
        }
    } else if (data.length === 3 && condition) {
        let then = getThen(data[1] as any, addElement, addSwitchElemen, labelKey, nestedId)
        let elseThen = getThen(data[2] as any, addElement, addSwitchElemen, labelKey, nestedId)
        return {
            type: "ifelse",
            condition: {
                type: "value",
                storageType: "label",
                storageOperationType: "get",
                label: getLabelByStandardDivert(getLabelByStandardDivert(condition["CNT?"], labelKey), labelKey),
            },
            then: then,
            else: elseThen
        }
    }
    else {
        console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
    }
    return undefined
}

function getThen<T>(
    cond: (StandardDivert | Cond)[],
    addElement: (list: (T | PixiVNJsonConditionalStatements<T>)[], item: T | string | PixiVNJsonConditionalStatements<T>) => void,
    addSwitchElemen: (list: PixiVNJsonStepSwitchElementType<T>[], item: T | string | StandardDivert | PixiVNJsonConditionalStatements<T>) => void,
    labelKey: string,
    nestedId: string | undefined = undefined
): PixiVNJsonConditionalResultToCombine<T> | T | PixiVNJsonConditionalStatements<T> {
    let res: (T | PixiVNJsonConditionalStatements<T>)[] = []
    let isInEnv = false
    let isConditionalText = false
    let conditionalList: RootParserItemType[] = []

    for (const item of cond) {
        if (typeof item === "object" && "b" in item) {
            if (item.b.length > 2) {
                // remove the last 2 items
                item.b.pop()
                item.b.pop()
            }
            item.b.forEach((rootItem) => {
                if (rootItem instanceof Array) {
                    if (rootItem.includes("visit")) {
                        let i = getVariableValue<T>(rootItem as any, addSwitchElemen, addElement, labelKey, nestedId)
                        if (i) {
                            addElement(res, i)
                        }
                    }
                }
                else if (isInEnv) {
                    if (rootItem && typeof rootItem === "object" && "CNT?" in rootItem) {
                        isConditionalText = true
                        conditionalList.push(rootItem)
                    }
                }
                else if (typeof rootItem === "string") {
                    if (rootItem == "ev") {
                        isInEnv = true
                    }
                    else if (rootItem == 'nop' && isConditionalText) {
                        let i = getConditionalValue(conditionalList as any[], addElement, addSwitchElemen, labelKey, nestedId)
                        isConditionalText = false
                        conditionalList = []
                        if (i) {
                            addElement(res, i)
                        }
                    }
                    else {
                        // TODO
                        // if (rootItem.startsWith("^")) {
                        //     addElement(res, rootItem.substring(1))
                        // }
                        addElement(res, rootItem)
                    }
                }
            })
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