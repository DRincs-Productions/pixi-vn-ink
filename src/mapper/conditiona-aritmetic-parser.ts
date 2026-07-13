import { CHOISE_LABEL_KEY_SEPARATOR } from "@/constant";
import {
    type ArithmeticFunctions,
    arithmeticFunctions,
    type ArithmeticFunctionsSingle,
    arithmeticFunctionsSingle,
} from "@/interfaces/parserItems/NativeFunctions";
import type { MapperSharedType } from "@/mapper/types";
import { getPixiVNJsonLabelChoice, getValue } from "@/mapper/value-utility";
import { getLabelByStandardDivert } from "@/utils/divert-utility";
import { logger } from "@/utils/log-utility";
import { getText } from "@/utils/text-utility";
import type { StorageElementType } from "@drincs/pixi-vn";
import { PixiVNJsonComparationOperators } from "@drincs/pixi-vn-json/constants";
import type {
    PixiVNJsonArithmeticOperations,
    PixiVNJsonComparation,
    PixiVNJsonComparationOperatorsType,
    PixiVNJsonConditions,
    PixiVNJsonFunction,
    PixiVNJsonUnionCondition,
    PixiVNJsonValueGet,
} from "@drincs/pixi-vn-json/schema";

export function conditionaAritmeticParser(
    list: any[],
    labelKey: string,
    paramNames: string[],
    shared: MapperSharedType,
) {
    const { functions } = shared;
    list = list.map((item) => {
        if (typeof item === "string") {
            switch (item) {
                case "rnd":
                    return "RANDOM";
                case "?":
                    return "CONTAINS";
            }
        }
        return item;
    });
    const conditions: (
        | PixiVNJsonArithmeticOperations
        | PixiVNJsonValueGet
        | StorageElementType
        | PixiVNJsonConditions
        | PixiVNJsonFunction
    )[] = [];
    list.forEach((item) => {
        if (typeof item === "string") {
            switch (item) {
                case "&&":
                case "||":
                    if (conditions.length >= 2) {
                        const i: PixiVNJsonConditions = {
                            type: "union",
                            unionType: item === "&&" ? "and" : "or",
                            conditions: [
                                conditions[conditions.length - 2],
                                conditions[conditions.length - 1],
                            ],
                        };
                        // remove last two elements
                        conditions.pop();
                        conditions.pop();
                        conditions.push(i);
                    }
                    break;
                case "!":
                    if (conditions.length === 0) {
                        logger.error(
                            "Error parsing ink file: Conditional statement is not valid",
                            list,
                        );
                    } else {
                        const i: PixiVNJsonConditions = {
                            type: "union",
                            unionType: "not",
                            condition: conditions[conditions.length - 1],
                        };
                        conditions[conditions.length - 1] = i;
                    }
                    break;
                case "!?":
                    if (conditions.length > 1) {
                        const i: PixiVNJsonUnionCondition = {
                            type: "union",
                            unionType: "not",
                            condition: {
                                type: "compare",
                                operator: "CONTAINS",
                                leftValue: conditions[conditions.length - 2],
                                rightValue: conditions[conditions.length - 1],
                            },
                        };
                        // remove last two elements
                        conditions.pop();
                        conditions.pop();
                        conditions.push(i);
                    } else {
                        logger.error(
                            "Error parsing ink file: Conditional statement is not valid",
                            list,
                        );
                    }
                    break;
                default:
                    if (
                        PixiVNJsonComparationOperators.includes(
                            item as PixiVNJsonComparationOperatorsType,
                        )
                    ) {
                        if (conditions.length < 2) {
                            logger.error(
                                "Error parsing ink file: Conditional statement is not valid",
                                list,
                            );
                        } else {
                            const i: PixiVNJsonComparation = {
                                type: "compare",
                                operator: item as PixiVNJsonComparationOperatorsType,
                                rightValue: conditions[conditions.length - 1] as any,
                                leftValue: conditions[conditions.length - 2] as any,
                            };
                            // remove last two elements
                            conditions.pop();
                            conditions.pop();
                            conditions.push(i);
                        }
                    } else if (arithmeticFunctions.includes(item as ArithmeticFunctions)) {
                        if (conditions.length < 2) {
                            logger.error(
                                "Error parsing ink file: Conditional statement is not valid",
                                list,
                            );
                        } else {
                            switch (item as ArithmeticFunctions) {
                                case "L^":
                                    item = "INTERSECTION";
                            }
                            const i: PixiVNJsonArithmeticOperations = {
                                type: "arithmetic",
                                operator: item,
                                rightValue: conditions[conditions.length - 1] as
                                    | PixiVNJsonValueGet
                                    | StorageElementType
                                    | PixiVNJsonArithmeticOperations,
                                leftValue: conditions[conditions.length - 2] as
                                    | PixiVNJsonValueGet
                                    | StorageElementType
                                    | PixiVNJsonArithmeticOperations,
                            };
                            // remove last two elements
                            conditions.pop();
                            conditions.pop();
                            conditions.push(i);
                        }
                    } else if (
                        arithmeticFunctionsSingle.includes(item as ArithmeticFunctionsSingle)
                    ) {
                        const i: PixiVNJsonArithmeticOperations = {
                            type: "arithmeticsingle",
                            operator: item as ArithmeticFunctionsSingle,
                            leftValue: conditions[conditions.length - 1] as
                                | PixiVNJsonValueGet
                                | StorageElementType
                                | PixiVNJsonArithmeticOperations,
                        };
                        // remove last two elements
                        conditions.pop();
                        conditions.push(i);
                    } else if (item.startsWith("^")) {
                        conditions.push(getText(item));
                    }
            }
        } else if (typeof item === "object" && "CNT?" in item) {
            if (new RegExp(/.*\.[0-9]\..*/).test(item["CNT?"])) {
                const items = item["CNT?"].split(".");
                // remove the last element
                const end = items.pop();
                const stringNumber = items.pop();
                if (stringNumber === undefined || end === undefined) {
                    logger.error(
                        "Error parsing ink file: Conditional statement is not valid",
                        list,
                    );
                    return;
                }
                const number = Number(stringNumber);
                let label = items.join(".");
                if (label.includes("^.")) {
                    const labelArray = label.split(".");
                    const end2 = labelArray[labelArray.length - 1].replaceAll(
                        ".",
                        CHOISE_LABEL_KEY_SEPARATOR,
                    );
                    labelArray.pop();
                    label = `${labelArray.join(".")}.${end2}`;
                    if (end.includes("c-")) {
                        label = label + CHOISE_LABEL_KEY_SEPARATOR + end;
                    }
                } else {
                    label = label.replaceAll(".", CHOISE_LABEL_KEY_SEPARATOR);
                }
                const labelIdToOpen = getLabelByStandardDivert(label, labelKey);
                if (!labelIdToOpen) {
                    return;
                }
                conditions.push({
                    type: "compare",
                    leftValue: getPixiVNJsonLabelChoice(labelIdToOpen),
                    operator: ">=",
                    rightValue: {
                        type: "value",
                        value: number,
                    },
                });
            } else {
                const labelIdToOpen = getLabelByStandardDivert(item["CNT?"], labelKey);
                if (!labelIdToOpen) {
                    return;
                }
                conditions.push(getPixiVNJsonLabelChoice(labelIdToOpen));
            }
        } else if (typeof item === "object" && "VAR?" in item) {
            conditions.push(
                getValue({ key: item["VAR?"], defaultType: "storage" }, paramNames, shared),
            );
        } else if (typeof item === "object" && "f()" in item) {
            const functionName = item["f()"];
            const fun = functions.find((f) => f.name === functionName);
            if (!fun) {
                logger.error(
                    `Error parsing ink file: Function ${functionName} is not defined`,
                    list,
                );
                return;
            }
            const args = [];
            for (let i = 0; i < fun.args; i++) {
                if (conditions.length !== 0) {
                    args.push(conditions.pop());
                }
            }
            conditions.push({
                type: "function",
                functionName: functionName,
                args: args.reverse(),
            });
        } else if (typeof item === "object" && "^->" in item) {
            const i: string = item["^->"];
            if (!i.includes("$r")) {
                conditions.push(item["^->"]);
            }
        } else if (typeof item === "object" && "list" in item) {
            const listValue = Object.values(item.list).map((value) => {
                return value;
            });
            conditions.push(listValue as number[]);
        } else {
            conditions.push(item);
        }
    });
    return conditions;
}
