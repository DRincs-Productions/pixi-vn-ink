import type { ListInk } from "@/interfaces/parserItems/List";
import { conditionaAritmeticParser } from "@/mapper/conditiona-aritmetic-parser";
import type { MapperSharedType } from "@/mapper/types";
import type { PixiVNJsonValueGet, PixiVNJsonValueSet } from "@drincs/pixi-vn-json/schema";

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
    defaultType: "storage" | "tempstorage",
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
): PixiVNJsonValueSet[] {
    const paramIndex = paramNames.indexOf(key);
    if (paramIndex >= 0) {
        return [
            {
                type: "value",
                storageType: "params",
                storageOperationType: "set",
                key: paramIndex,
                value: value,
            },
        ];
    } else if (typeof value === "object" && "list" in value && typeof value.list === "object") {
        if (
            "origins" in value &&
            Array.isArray(value.origins) &&
            (value.origins as string[]).length > 0
        ) {
            return (value.origins as string[]).reduce((acc: PixiVNJsonValueSet[], origin) => {
                acc.push({
                    type: "value",
                    storageOperationType: "set",
                    storageType: defaultType,
                    key: key,
                    value: Object.values(shared.enums[key]),
                });
                Object.entries(shared.enums[key]).forEach(([enumKey, enumValue]) => {
                    acc.push({
                        type: "value",
                        storageOperationType: "set",
                        storageType: defaultType,
                        key: enumKey,
                        value: enumValue,
                    });
                });
                return acc;
            }, []);
        }
        return [
            {
                type: "value",
                storageOperationType: "set",
                storageType: defaultType,
                key: key,
                value: Object.values(value.list),
            },
        ];
    }
    return [
        {
            type: "value",
            storageOperationType: "set",
            storageType: defaultType,
            key: key,
            value: value,
        },
    ];
}
