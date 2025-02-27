import { StorageElementType } from "@drincs/pixi-vn";
import {
    PixiVNJsonArithmeticOperations,
    PixiVNJsonChoiceGet,
    PixiVNJsonComparation,
    PixiVNJsonConditions,
    PixiVNJsonLabelGet,
    PixiVNJsonValueGet,
} from "@drincs/pixi-vn-json";
import { CHOISE_LABEL_KEY_SEPARATOR } from "../constant";
import { logger } from "../functions/log-utility";
import {
    arithmeticFunctions,
    ArithmeticFunctions,
    arithmeticFunctionsSingle,
    ArithmeticFunctionsSingle,
    conditionFunctions,
    ConditionFunctions,
} from "../types/parserItems/NativeFunctions";
import { getLabelByStandardDivert } from "../utility/divert-utility";
import { getText } from "../utility/text-utility";
import { getValue } from "../utility/value-utility";

export function conditionaAritmeticParser(list: any[], labelKey: string, paramNames: string[]) {
    list = list.map((item) => {
        if (typeof item === "string") {
            if ((item as any) === "rnd") {
                return "RANDOM";
            }
            if ((item as any) === "?") {
                return "CONTAINS";
            }
        }
        return item;
    });
    let conditions: (
        | PixiVNJsonArithmeticOperations
        | PixiVNJsonValueGet
        | StorageElementType
        | PixiVNJsonConditions
    )[] = [];
    list.forEach((item) => {
        if (typeof item === "object" && "CNT?" in item) {
            if (new RegExp(/.*\.[0-9]\..*/).test(item["CNT?"])) {
                let items = item["CNT?"].split(".");
                // remove the last element
                let end = items.pop();
                let stringNumber = items.pop();
                if (stringNumber === undefined || end === undefined) {
                    logger.error("Error parsing ink file: Conditional statement is not valid", list);
                    return;
                }
                let number = parseInt(stringNumber);
                let label = items.join(".");
                if (label.includes("^.")) {
                    let labelArray = label.split(".");
                    let end2 = labelArray[labelArray.length - 1].replaceAll(".", CHOISE_LABEL_KEY_SEPARATOR);
                    labelArray.pop();
                    label = labelArray.join(".") + "." + end2;
                    if (end.includes("c-")) {
                        label = label + CHOISE_LABEL_KEY_SEPARATOR + end;
                    }
                } else {
                    label = label.replaceAll(".", CHOISE_LABEL_KEY_SEPARATOR);
                }
                let labelIdToOpen = getLabelByStandardDivert(label, labelKey);
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
                let labelIdToOpen = getLabelByStandardDivert(item["CNT?"], labelKey);
                if (!labelIdToOpen) {
                    return;
                }
                conditions.push(getPixiVNJsonLabelChoice(labelIdToOpen));
            }
        } else if (typeof item === "object" && "VAR?" in item) {
            conditions.push(getValue(item["VAR?"], paramNames));
        } else if (item === "&&" || item === "||") {
            if (conditions.length >= 2) {
                let i: PixiVNJsonConditions = {
                    type: "union",
                    unionType: item === "&&" ? "and" : "or",
                    conditions: [conditions[conditions.length - 2], conditions[conditions.length - 1]],
                };
                // remove last two elements
                conditions.pop();
                conditions.pop();
                conditions.push(i);
            }
        } else if (item === "!") {
            if (conditions.length === 0) {
                logger.error("Error parsing ink file: Conditional statement is not valid", list);
            } else {
                let i: PixiVNJsonConditions = {
                    type: "union",
                    unionType: "not",
                    condition: conditions[conditions.length - 1],
                };
                conditions[conditions.length - 1] = i;
            }
        } else if (item && typeof item === "string" && conditionFunctions.includes(item as ConditionFunctions)) {
            if (conditions.length < 2) {
                logger.error("Error parsing ink file: Conditional statement is not valid", list);
            } else {
                let i: PixiVNJsonComparation = {
                    type: "compare",
                    operator: item as ConditionFunctions,
                    rightValue: conditions[conditions.length - 1] as any,
                    leftValue: conditions[conditions.length - 2] as any,
                };
                // remove last two elements
                conditions.pop();
                conditions.pop();
                conditions.push(i);
            }
        } else if (item && typeof item === "string" && arithmeticFunctions.includes(item as ArithmeticFunctions)) {
            if (conditions.length < 2) {
                logger.error("Error parsing ink file: Conditional statement is not valid", list);
            } else {
                let i: PixiVNJsonArithmeticOperations = {
                    type: "arithmetic",
                    operator: item as ArithmeticFunctions,
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
            item &&
            typeof item === "string" &&
            arithmeticFunctionsSingle.includes(item as ArithmeticFunctionsSingle)
        ) {
            let i: PixiVNJsonArithmeticOperations = {
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
        } else if (item && typeof item === "string") {
            if (item.startsWith("^")) {
                conditions.push(getText(item));
            }
        } else if (typeof item === "object" && "^->" in item) {
            let i: string = item["^->"];
            if (!i.includes("$r")) {
                conditions.push(item["^->"]);
            }
        } else {
            conditions.push(item);
        }
    });
    return conditions;
}

function getPixiVNJsonLabelChoice(label: string): PixiVNJsonLabelGet | PixiVNJsonChoiceGet {
    // try {
    //     let list = label.split(CHOISE_LABEL_KEY_SEPARATOR)
    //     let end = list[list.length - 1]
    //     if (end.includes("c-")) {
    //         let stringNumber = end.split("c-")[1]
    //         let number = parseInt(stringNumber)
    //         return {
    //             type: "value",
    //             storageType: "choice",
    //             storageOperationType: "get",
    //             index: number,
    //         }
    //     }
    // } catch (e) { }

    return {
        type: "value",
        storageType: "label",
        storageOperationType: "get",
        label: label,
    };
}
