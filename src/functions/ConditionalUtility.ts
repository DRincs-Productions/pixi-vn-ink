import { PixiVNJsonConditionalStatements, PixiVNJsonConditions } from "@drincs/pixi-vn";
import Cond from "../types/parserItems/Cond";
import { StandardDivert } from "../types/parserItems/Divert";
import NativeFunctions from "../types/parserItems/NativeFunctions";
import ReadCount from "../types/parserItems/ReadCount";
import RootParserItemType from "../types/parserItems/RootParserItemType";
import { getLabelByStandardDivert } from "./DivertUtility";

export function getConditional<T>(then: T | PixiVNJsonConditionalStatements<T>, data: (ReadCount | NativeFunctions)[], labelKey: string, elseThen?: T | PixiVNJsonConditionalStatements<T>): T | PixiVNJsonConditionalStatements<T> {
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

export function getConditionalText(data: (ReadCount | (StandardDivert | Cond)[])[], labelKey: string): PixiVNJsonConditionalStatements<string> | undefined {
    if (data.length === 2) {
        let then: (string | PixiVNJsonConditionalStatements<string>)[] = []
        getThen(data[1] as any, then, labelKey)
        console.log(data)
    } else if (data.length === 3) {
        let then: (string | PixiVNJsonConditionalStatements<string>)[] = []
        let elseThen: (string | PixiVNJsonConditionalStatements<string>)[] = []
        getThen(data[1] as any, then, labelKey)
        getThen(data[2] as any, elseThen, labelKey)
        console.log(data)
    }
    else {
        console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
    }
    return undefined
}
function getThen(cond: (StandardDivert | Cond)[], res: (string | PixiVNJsonConditionalStatements<string>)[], labelKey: string) {
    let isInEnv = false
    let isConditionalText = false
    let conditionalList: RootParserItemType[] = []

    for (const item of cond) {
        if (typeof item === "object" && "b" in item) {
            item.b.forEach((rootItem) => {
                if (isInEnv) {
                    if (rootItem && typeof rootItem === "object" && "CNT?" in rootItem) {
                        isConditionalText = true
                        conditionalList.push(rootItem)
                    }
                }
                else if (typeof rootItem === "string") {
                    if (rootItem.startsWith("^")) {
                        res.push(rootItem.substring(1))
                    }
                    else if (rootItem == "ev") {
                        isInEnv = true
                    }
                    else if (rootItem == 'nop' && isConditionalText) {
                        getConditionalText(conditionalList as any[], labelKey)
                        isConditionalText = false
                        conditionalList = []
                    }
                }
            })
        }
    }
}