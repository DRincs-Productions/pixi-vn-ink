import type { ListInk } from "@/interfaces/parserItems/List";
import { conditionaAritmeticParser } from "@/mapper/conditiona-aritmetic-parser";
import type { MapperSharedType } from "@/mapper/types";
import type { StorageElementType } from "@drincs/pixi-vn";
import type { PixiVNJsonArithmeticOperationsArithmetic } from "@drincs/pixi-vn-json";
import type {
    PixiVNJsonStorageGet,
    PixiVNJsonValueGet,
    PixiVNJsonValueSet,
} from "@drincs/pixi-vn-json/schema";

export function getParam(
    list: any[],
    labelKey: string,
    paramNames: string[],
    shared: MapperSharedType,
): any[] {
    const res: any[] = conditionaAritmeticParser(list, labelKey, paramNames, shared);
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
    value: any | ListInk,
    defaultType: "storage" | "tempstorage",
    shared: MapperSharedType,
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
    } else if (typeof value === "object" && "list" in value && typeof value.list === "object") {
        if (
            "origins" in value &&
            Array.isArray(value.origins) &&
            (value.origins as string[]).length > 0
        ) {
            const origins: (PixiVNJsonStorageGet | StorageElementType)[] = (
                value.origins as string[]
            ).map((origin) => {
                if (key === origin && shared.enums && key in shared.enums) {
                    return shared.enums[key];
                } else {
                    return {
                        type: "value",
                        storageOperationType: "get",
                        storageType: "storage",
                        key: origin,
                    };
                }
            });
            if (origins.length === 1) {
                return {
                    type: "value",
                    storageOperationType: "set",
                    storageType: defaultType,
                    key: key,
                    value: origins[0],
                };
            } else {
                let aritmetic: PixiVNJsonArithmeticOperationsArithmetic = {
                    type: "arithmetic",
                    operator: "+",
                    leftValue: origins[0],
                    rightValue: origins[1],
                };
                if (origins.length > 2) {
                    for (let i = 2; i < origins.length; i++) {
                        aritmetic = {
                            type: "arithmetic",
                            operator: "+",
                            leftValue: aritmetic,
                            rightValue: origins[i],
                        };
                    }
                }
                return {
                    type: "value",
                    storageOperationType: "set",
                    storageType: defaultType,
                    key: key,
                    value: aritmetic,
                };
            }
        }
        return {
            type: "value",
            storageOperationType: "set",
            storageType: defaultType,
            key: key,
            value: Object.values(value.list),
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
