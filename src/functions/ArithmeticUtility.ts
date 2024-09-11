import { PixiVNJsonArithmeticOperations, PixiVNJsonValueGet, StorageElementType } from '@drincs/pixi-vn';
import { ArithmeticFunctions, arithmeticFunctions } from '../types/parserItems/NativeFunctions';
import VariableReference from '../types/parserItems/VariableReference';

export function arithmeticParser(data: (ArithmeticFunctions | VariableReference)[]): PixiVNJsonValueGet | StorageElementType | undefined {
    if (data.length === 0) {
        console.error("[Pixi’VN Ink] Error parsing ink file: Arithmetic statement is not valid", data)
        return undefined
    }
    let conditions: (PixiVNJsonArithmeticOperations | PixiVNJsonValueGet | StorageElementType)[] = []
    data.reverse().forEach((item) => {
        if (typeof item === "object" && "VAR?" in item) {
            conditions.push({
                type: "value",
                storageType: "storage",
                storageOperationType: "get",
                key: item["VAR?"],
            })
        }
        else if (item && typeof item === "string" && arithmeticFunctions.includes(item)) {
            if (conditions.length < 2) {
                console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
            }
            else {
                if (item === "rnd") {
                    item = "RANDOM" as any
                }
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
        // else if (item === "!") {
        //     if (conditions.length === 0) {
        //         console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
        //     }
        //     else {
        //         let i: PixiVNJsonArithmeticOperations = {
        //             type: "union",
        //             unionType: "not",
        //             condition: conditions[conditions.length - 1]
        //         }
        //         conditions[conditions.length - 1] = i
        //     }
        // }
        else {
            conditions.push(item)
        }
    })
    if (conditions.length === 1) {
        let first = conditions[0]
        if (first && typeof first === "object" && "type" in first && (first.type === "arithmetic" || first.type === "arithmeticsingle")) {
            return {
                type: "value",
                storageType: "arithmetic",
                storageOperationType: "get",
                operation: first
            } as PixiVNJsonValueGet
        }
        else {
            return first as StorageElementType | PixiVNJsonValueGet
        }
    }
    else {
        console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
    }
}
