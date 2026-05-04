import type { ListInk } from "@/interfaces/parserItems/List";
import { conditionaAritmeticParser } from "@/mapper/conditiona-aritmetic-parser";
import type { MapperSharedType } from "@/mapper/types";
import type {
    PixiVNJsonChoiceGet,
    PixiVNJsonLabelGet,
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
    options: { key: string; defaultType: "storage" | "tempstorage" },
    paramNames: string[],
    shared: MapperSharedType,
): PixiVNJsonValueGet {
    const { key, defaultType } = options;
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
    options: { key: string; value: any | ListInk; defaultType: "storage" | "tempstorage" },
    paramNames: string[],
    shared: MapperSharedType,
): PixiVNJsonValueSet[] {
    const { key, value, defaultType } = options;
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
            return (value.origins as string[]).reduce((acc: PixiVNJsonValueSet[]) => {
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
                        key: `${key}.${enumKey}`,
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

export function getPixiVNJsonLabelChoice(label: string): PixiVNJsonLabelGet | PixiVNJsonChoiceGet {
    return {
        type: "value",
        storageType: "label",
        storageOperationType: "get",
        label: label,
    };
}
