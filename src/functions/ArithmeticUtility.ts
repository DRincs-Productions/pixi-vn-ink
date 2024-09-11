import { PixiVNJsonValueGet, StorageElementType } from '@drincs/pixi-vn';
import { conditionaAritmeticParser } from '../parser/ConditionaAritmeticParser';
import { ArithmeticFunctions } from '../types/parserItems/NativeFunctions';
import VariableReference from '../types/parserItems/VariableReference';

export function arithmeticParser(data: (ArithmeticFunctions | VariableReference)[], labelKey: string): PixiVNJsonValueGet | StorageElementType | undefined {
    if (data.length === 0) {
        console.error("[Pixi’VN Ink] Error parsing ink file: Arithmetic statement is not valid", data)
        return undefined
    }
    let conditions = conditionaAritmeticParser(data, labelKey)
    if (conditions.length === 1) {
        let first = conditions[0]
        if (first && typeof first === "object" && "type" in first //&& (first.type === "arithmetic" || first.type === "arithmeticsingle")
        ) {
            let i: PixiVNJsonValueGet = {
                type: "value",
                storageType: "arithmetic",
                storageOperationType: "get",
                operation: first
            }
            return i
        }
        else {
            return first
        }
    }
    else {
        console.error("[Pixi’VN Ink] Error parsing ink file: Conditional statement is not valid", data)
    }
}
