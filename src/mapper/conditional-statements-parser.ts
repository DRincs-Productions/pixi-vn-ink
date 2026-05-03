import { CHOISE_LABEL_KEY_SEPARATOR } from "@/constant";
import type InkRootType from "@/interfaces/InkRootType";
import type Cond from "@/interfaces/parserItems/Cond";
import type { DivertTunnel, StandardDivert } from "@/interfaces/parserItems/Divert";
import type NativeFunctions from "@/interfaces/parserItems/NativeFunctions";
import type ReadCount from "@/interfaces/parserItems/ReadCount";
import type RootParserItemType from "@/interfaces/parserItems/RootParserItemType";
import type { MyVariableAssignment } from "@/interfaces/parserItems/VariableAssignment";
import type VariableReference from "@/interfaces/parserItems/VariableReference";
import { addChoiseIntoList } from "@/mapper/choice-info-converter";
import { conditionaAritmeticParser } from "@/mapper/conditiona-aritmetic-parser";
import { parseLabel, type ShareDataParserLabel } from "@/mapper/label-parser";
import { logger } from "@/utils/log-utility";
import type {
    PixiVNJsonConditionalResultToCombine,
    PixiVNJsonConditionalStatements,
    PixiVNJsonStepSwitchElementType,
} from "@drincs/pixi-vn-json/schema";

export function parserConditionalStatements<T>(
    then: T | PixiVNJsonConditionalStatements<T> | PixiVNJsonConditionalResultToCombine<T>,
    data: (ReadCount | NativeFunctions | VariableReference)[],
    paramNames: string[],
    labelKey: string,
    elseThen?: T | PixiVNJsonConditionalStatements<T> | PixiVNJsonConditionalResultToCombine<T>,
    functions: { name: string; args: number }[] = [],
): undefined | PixiVNJsonConditionalStatements<T> {
    if (data.length === 0) {
        return undefined;
    }
    const conditions = conditionaAritmeticParser(data, labelKey, paramNames, functions);
    if (conditions.length === 1) {
        const res: PixiVNJsonConditionalStatements<T> = {
            type: "ifelse",
            condition: conditions[0],
            then: then,
            else: elseThen,
        };
        if (!res.else) {
            delete res.else;
        }
        return res;
    } else if (conditions.length > 1) {
        const res: PixiVNJsonConditionalStatements<T> = {
            type: "ifelse",
            condition: {
                type: "union",
                unionType: "and",
                conditions: conditions,
            },
            then: then,
            else: elseThen,
        };
        if (!res.else) {
            delete res.else;
        }
        return res;
    }
}

export function getConditionalValue<T>(
    preData: (ReadCount | (StandardDivert | Cond)[])[],
    addSwitchElemen: (
        list: PixiVNJsonStepSwitchElementType<T>[],
        item:
            | T
            | string
            | StandardDivert
            | DivertTunnel
            | PixiVNJsonStepSwitchElementType<T>
            | MyVariableAssignment,
        labelKey: string,
        paramNames: string[],
    ) => void,
    addLabels: (
        storyItem: InkRootType | RootParserItemType,
        dadLabelKey: string,
        shareData: ShareDataParserLabel,
    ) => void,
    labelKey: string,
    shareData: ShareDataParserLabel,
    paramNames: string[],
    nestedId: string | undefined = undefined,
): PixiVNJsonConditionalStatements<T> | undefined {
    if (preData.length === 0) {
        logger.error("Error parsing ink file: Conditional statement is not valid", preData);
        return undefined;
    }
    const condition: (ReadCount | NativeFunctions)[] = [];
    let data: (StandardDivert | Cond)[][] = [];
    // split the data
    preData.forEach((item) => {
        if (Array.isArray(item)) {
            data.push(item);
        } else if (typeof item === "string" && item === "du") {
            if (shareData.du) {
                condition.push(shareData.du);
            } else {
                shareData.du = condition[condition.length - 1];
            }
        } else if (typeof item !== "string" || item !== "/ev") {
            condition.push(item);
        }
    });

    if (data.length === 0) {
        logger.error("Error parsing ink file: Conditional statement is not valid", data);
        return undefined;
    }

    const then = getThen<T>(
        data[0],
        addSwitchElemen,
        addLabels,
        `${labelKey}${CHOISE_LABEL_KEY_SEPARATOR}then`,
        shareData,
        paramNames,
        `${nestedId || ""}then`,
    );
    let elseThen:
        | PixiVNJsonConditionalResultToCombine<T>
        | T
        | PixiVNJsonConditionalStatements<T>
        | undefined;
    if (data.length === 2) {
        elseThen = getThen<T>(
            data[1],
            addSwitchElemen,
            addLabels,
            `${labelKey}${CHOISE_LABEL_KEY_SEPARATOR}else`,
            shareData,
            paramNames,
            `${nestedId || ""}else`,
        );
    } else if (data.length > 2) {
        data.shift();
        data.push("nop" as any);
        data = [{ b: data } as any];
        elseThen = getThen<T>(
            data as any,
            addSwitchElemen,
            addLabels,
            `${labelKey}${CHOISE_LABEL_KEY_SEPARATOR}else`,
            shareData,
            paramNames,
            `${nestedId || ""}else`,
        );
    } else {
        elseThen = undefined;
    }
    shareData.du = undefined;
    return parserConditionalStatements<T>(
        then,
        condition,
        paramNames,
        labelKey,
        elseThen,
        shareData.functions,
    );
}

function getThen<T>(
    cond: (StandardDivert | Cond)[],
    addSwitchElemen: (
        list: PixiVNJsonStepSwitchElementType<T>[],
        item:
            | T
            | string
            | StandardDivert
            | DivertTunnel
            | PixiVNJsonStepSwitchElementType<T>
            | MyVariableAssignment,
        labelKey: string,
        paramNames: string[],
    ) => void,
    addLabels: (
        storyItem: InkRootType | RootParserItemType,
        dadLabelKey: string,
        shareData: ShareDataParserLabel,
    ) => void,
    labelKey: string,
    shareData: ShareDataParserLabel,
    paramNames: string[],
    nestedId: string | undefined = undefined,
): PixiVNJsonConditionalResultToCombine<T> | T | PixiVNJsonConditionalStatements<T> {
    const res: T[] = [];

    for (const item of cond) {
        if (typeof item === "object" && "b" in item) {
            item.b = item.b.filter(
                (item) =>
                    item !== null &&
                    !(
                        typeof item === "object" &&
                        "->" in item &&
                        new RegExp(/.*\.[0-9]/).test(item["->"])
                    ),
            );
            parseLabel<T>(
                item.b,
                labelKey,
                shareData,
                res,
                addSwitchElemen,
                addSwitchElemen,
                addLabels,
                addChoiseIntoList,
                nestedId,
                true,
                paramNames,
            );
        }
    }
    if (res.length === 1) {
        return res[0];
    }
    const combinateRes: PixiVNJsonConditionalResultToCombine<T> = {
        type: "resulttocombine",
        combine: "cross",
        secondConditionalItem: res,
    };
    return combinateRes;
}
