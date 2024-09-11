import { PixiVNJsonArithmeticOperations, PixiVNJsonConditions, PixiVNJsonValueGet, StorageElementType } from "@drincs/pixi-vn";
import { CHOISE_LABEL_KEY_SEPARATOR } from "../constant";
import { ArithmeticFunctions } from "../types/parserItems/NativeFunctions";
import { getLabelByStandardDivert } from "../utility/DivertUtility";

export function conditionaAritmeticParser<T>(
    list: any[],
    labelKey: string
) {
    list = list.map((item) => {
        if (typeof item === "string") {
            if (item as any === "rnd") {
                return "RANDOM"
            }
            if (item as any === "?") {
                return "CONTAINS"
            }
        }
        return item
    })
    let conditions: (PixiVNJsonArithmeticOperations | PixiVNJsonValueGet | StorageElementType | PixiVNJsonConditions)[] = []
    list.forEach((item) => {
        if (typeof item === "object" && "CNT?" in item) {
            if ((new RegExp(/.*\.[0-9]\..*/)).test(item["CNT?"])) {
                let items = item["CNT?"].split(".")
                // remove the last element
                let end = items.pop()
                let stringNumber = items.pop()
                if (stringNumber === undefined || end === undefined) {
                    console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", list)
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
        else if (typeof item === "object" && "VAR?" in item) {
            conditions.push({
                type: "value",
                storageType: "storage",
                storageOperationType: "get",
                key: item["VAR?"],
            })
        }
        else if (item === "&&" || item === "||") {
            if (conditions.length < 2) {
                console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", list)
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
                console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", list)
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
        else if (item && typeof item === "string" && ["==", "!=", "<", "<=", ">", ">=", "CONTAINS"].includes(item)) {
            if (conditions.length < 2) {
                console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", list)
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
        else if (item && typeof item === "string" && ["+", "-", "/", "*", "%", "POW", "RANDOM", "MIN", "MAX"].includes(item as ArithmeticFunctions)) {
            if (conditions.length < 2) {
                console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", list)
            }
            else {
                let i: PixiVNJsonArithmeticOperations = {
                    type: "arithmetic",
                    operator: item,
                    rightValue: conditions[conditions.length - 1],
                    leftValue: conditions[conditions.length - 2]
                }
                // remove last two elements
                conditions.pop()
                conditions.pop()
                conditions.push(i)
            }
        }
        else if (item && typeof item === "string" && ["INT", "FLOOR", "FLOAT"].includes(item)) {
            let i: PixiVNJsonArithmeticOperations = {
                type: "arithmeticsingle",
                operator: item,
                leftValue: conditions[conditions.length - 1]
            }
            // remove last two elements
            conditions.pop()
            conditions.push(i)
        }
        else if (item && typeof item === "string") {
            if (item.startsWith("^")) {
                conditions.push(item.substring(1))
            }
        }
        else {
            conditions.push(item)
        }
    })
    return conditions
}
