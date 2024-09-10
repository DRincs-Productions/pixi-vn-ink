import { PixiVNJsonArithmeticOperations, PixiVNJsonValueGet } from '@drincs/pixi-vn/dist/PixiVNJsonConditionalStatements-Bc2_kvcw';
import NativeFunctions from '../types/parserItems/NativeFunctions';
import VariableReference from '../types/parserItems/VariableReference';

export function ArithmeticParser(data: (NativeFunctions | VariableReference)[]): PixiVNJsonArithmeticOperations | undefined {
    if (data.length === 0) {
        console.error("[Pixi’VN Ink] Error parsing ink file: Arithmetic statement is not valid", data)
        return undefined
    }
    let conditions: (PixiVNJsonArithmeticOperations | PixiVNJsonValueGet)[] = []
    data.forEach((item) => {
        if (typeof item === "object" && "VAR?" in item) {
            conditions.push({
                type: "value",
                storageType: "storage",
                storageOperationType: "get",
                key: item["VAR?"],
            })
        }
        else if (typeof item === "string" && item === "+") {
            if (conditions.length < 2) {
                console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
            }
            else {
                let i: PixiVNJsonArithmeticOperations = {
                    type: "arithmetic",
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
        else if (item === "!") {
            if (conditions.length === 0) {
                console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
            }
            else {
                let i: PixiVNJsonArithmeticOperations = {
                    type: "union",
                    unionType: "not",
                    condition: conditions[conditions.length - 1]
                }
                conditions[conditions.length - 1] = i
            }
        }
    })
    if (conditions.length === 1) {
        return conditions[0] as PixiVNJsonArithmeticOperations
    }
    else {
        console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
    }
}
