import type { ArithmeticFunctions } from "@/interfaces/parserItems/NativeFunctions";
import type VariableReference from "@/interfaces/parserItems/VariableReference";
import { conditionaAritmeticParser } from "@/mapper/conditiona-aritmetic-parser";
import { logger } from "@/utils/log-utility";
import type { StorageElementType } from "@drincs/pixi-vn";
import type { PixiVNJsonValueGet } from "@drincs/pixi-vn-json/schema";

export function arithmeticParser(
    data: (ArithmeticFunctions | VariableReference)[],
    labelKey: string,
    paramNames: string[],
    functions: { name: string; args: number }[] = [],
): PixiVNJsonValueGet | StorageElementType | undefined {
    if (data.length === 0) {
        logger.error("Error parsing ink file: Arithmetic statement is not valid", data);
        return undefined;
    }
    const conditions = conditionaAritmeticParser(data, labelKey, paramNames, functions);
    if (conditions.length === 1) {
        const first = conditions[0];
        if (
            first &&
            typeof first === "object" &&
            "type" in first //&& (first.type === "arithmetic" || first.type === "arithmeticsingle")
        ) {
            const i: PixiVNJsonValueGet = {
                type: "value",
                storageType: "logic",
                storageOperationType: "get",
                operation: first,
            };
            return i;
        } else {
            return first;
        }
    }
}
