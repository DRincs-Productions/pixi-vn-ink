import type { PixiVNJsonValueGet, PixiVNJsonValueSet } from "@drincs/pixi-vn-json";
import { conditionaAritmeticParser } from "../parser/conditiona-aritmetic-parser";

export function getParam(list: any[], labelKey: string, paramNames: string[]): any[] {
    const res: any[] = conditionaAritmeticParser(list, labelKey, paramNames);
    return res;
}

export function getValue(
    key: string,
    paramNames: string[],
    defaultType: "storage" | "tempstorage" = "storage",
): PixiVNJsonValueGet {
    const paramIndex = paramNames.indexOf(key);
    if (paramIndex >= 0) {
        return {
            type: "value",
            storageType: "params",
            storageOperationType: "get",
            key: paramIndex,
        };
    }
    return {
        type: "value",
        storageOperationType: "get",
        storageType: defaultType,
        key: key,
    };
}

export function getSetValue(
    key: string,
    paramNames: string[],
    value: any,
    defaultType: "storage" | "tempstorage" = "storage",
): PixiVNJsonValueSet {
    const paramIndex = paramNames.indexOf(key);
    if (paramIndex >= 0) {
        return {
            type: "value",
            storageType: "params",
            storageOperationType: "set",
            key: paramIndex,
            value: value,
        };
    }
    return {
        type: "value",
        storageOperationType: "set",
        storageType: defaultType,
        key: key,
        value: value,
    };
}
