import type { StorageElementType } from "@drincs/pixi-vn";
import type { PixiVNJsonValueGet } from "@drincs/pixi-vn-json";
import { logger } from "../functions/log-utility";
import { ArithmeticFunctions } from "../types/parserItems/NativeFunctions";
import VariableReference from "../types/parserItems/VariableReference";
import { conditionaAritmeticParser } from "./conditiona-aritmetic-parser";

export function arithmeticParser(
    data: (ArithmeticFunctions | VariableReference)[],
    labelKey: string,
    paramNames: string[]
): PixiVNJsonValueGet | StorageElementType | undefined {
    if (data.length === 0) {
        logger.error("Error parsing ink file: Arithmetic statement is not valid", data);
        return undefined;
    }
    let conditions = conditionaAritmeticParser(data, labelKey, paramNames);
    if (conditions.length === 1) {
        let first = conditions[0];
        if (
            first &&
            typeof first === "object" &&
            "type" in first //&& (first.type === "arithmetic" || first.type === "arithmeticsingle")
        ) {
            let i: PixiVNJsonValueGet = {
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
