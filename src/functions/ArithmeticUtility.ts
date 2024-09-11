import { PixiVNJsonArithmeticOperations, PixiVNJsonValueGet, StorageElementType } from '@drincs/pixi-vn';
import { ArithmeticFunctions, arithmeticFunctions, arithmeticFunctionsSingle } from '../types/parserItems/NativeFunctions';
import VariableReference from '../types/parserItems/VariableReference';

export function arithmeticParser(data: (ArithmeticFunctions | VariableReference)[]): PixiVNJsonValueGet | StorageElementType | undefined {
    if (data.length === 0) {
        console.error("[Pixi’VN Ink] Error parsing ink file: Arithmetic statement is not valid", data)
        return undefined
    }
    data = data.map((item) => {
        if (typeof item === "string") {
            if (item as any === "rnd") {
                return "RANDOM"
            }
        }
        return item
    })
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
        else if (item && typeof item === "string" && arithmeticFunctionsSingle.includes(item)) {
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
