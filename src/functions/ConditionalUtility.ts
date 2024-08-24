import { PixiVNJsonConditionalStatements, PixiVNJsonConditions } from "@drincs/pixi-vn";
import NativeFunctions from "../types/parserItems/NativeFunctions";
import ReadCount from "../types/parserItems/ReadCount";
import { getLabelByStandardDivert } from "./DivertUtility";

export function getConditional<T>(element: T, data: (ReadCount | NativeFunctions)[], labelKey: string): T | PixiVNJsonConditionalStatements<T> {
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
                then: element
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
                then: element
            }
        }
    }
    return element
}