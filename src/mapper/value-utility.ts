import type { ListInk } from "@/interfaces/parserItems/List";
import type VariableReference from "@/interfaces/parserItems/VariableReference";
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
    options: {
        key: string;
        value: any | ListInk | VariableReference;
        defaultType: "storage" | "tempstorage";
    },
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
    } else if (typeof value === "object") {
        if ("list" in value && typeof value.list === "object") {
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
        } else if (typeof value === "object" && "VAR?" in value) {
            if (typeof value["VAR?"] === "string" && value["VAR?"].includes(".")) {
                const [enumKey, enumValueKey] = value["VAR?"].split(".");
                if (enumKey in shared.enums && enumValueKey in shared.enums[enumKey]) {
                    return [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: defaultType,
                            key: key,
                            value: shared.enums[enumKey][enumValueKey],
                        },
                    ];
                }
            }
            return [
                {
                    type: "value",
                    storageOperationType: "set",
                    storageType: defaultType,
                    key: key,
                    value: getValue(
                        { key: value["VAR?"], defaultType: "storage" },
                        paramNames,
                        shared,
                    ),
                },
            ];
        }
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
