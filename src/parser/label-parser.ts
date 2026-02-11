import type {
    PixiVNJsonArithmeticOperations,
    PixiVNJsonConditionalStatements,
    PixiVNJsonStepSwitchElementType,
} from "@drincs/pixi-vn-json";
import { CHOISE_LABEL_KEY_SEPARATOR } from "../constant";
import { logger } from "../functions/log-utility";
import InkRootType from "../interfaces/InkRootType";
import { ContainerTypeN } from "../interfaces/parserItems/ContainerType";
import { StandardDivert } from "../interfaces/parserItems/Divert";
import RootParserItemType from "../interfaces/parserItems/RootParserItemType";
import { MyVariableAssignment } from "../interfaces/parserItems/VariableAssignment";
import { getParam, getSetValue, getValue } from "../utils/value-utility";
import { addSwitchComment } from "./adding-elements";
import { arithmeticParser } from "./arithmetic-parser";
import { getConditionalValue } from "./conditional-statements-parser";
import { parserSwitch } from "./switch-parser";

export type ShareDataParserLabel = {
    preDialog: { [label: string]: { text: string; glue: boolean } };
    du?: any;
    params?: {};
};
export function parseLabel<T>(
    rootList: RootParserItemType[],
    labelKey: string,
    shareData: ShareDataParserLabel,
    itemList: T[] = [],
    addElement: (
        list: T[],
        item: T | string | StandardDivert | PixiVNJsonStepSwitchElementType<T> | MyVariableAssignment,
        labelKey: string,
        paramNames: string[],
        options: {
            isNewLine: boolean;
            isHashtagScript: boolean;
            isThreads: boolean;
        },
    ) => void,
    addSwitchElemen: (
        list: PixiVNJsonStepSwitchElementType<T>[],
        item: T | string | StandardDivert | PixiVNJsonStepSwitchElementType<T> | MyVariableAssignment,
        labelKey: string,
        paramNames: string[],
        options?: {
            isNewLine?: boolean;
            isThreads: boolean;
        },
    ) => void,
    addLabels: (
        storyItem: InkRootType | RootParserItemType,
        dadLabelKey: string,
        shareData: ShareDataParserLabel,
    ) => void,
    addChoiseList: (
        choiseList: RootParserItemType[],
        itemList: (T | PixiVNJsonConditionalStatements<T>)[],
        labelKey: string,
        shareData: ShareDataParserLabel,
        paramNames: string[],
    ) => void,
    nestedId: string | undefined = undefined,
    isNewLine: boolean = true,
    paramNames: string[] = [],
) {
    let isInEnv = false;
    let envList: RootParserItemType[] = [];
    let isConditionalText = false;
    let isHashtagScript = false;
    let isThreads = false;
    let conditionalList: RootParserItemType[] = [];
    let commentList: any[] = [];
    if (shareData.preDialog[labelKey]) {
        // *	Hello [back!] right back to you!
        isNewLine = false;
        addElement(itemList, "^" + shareData.preDialog[labelKey].text, labelKey, paramNames, {
            isNewLine,
            isHashtagScript,
            isThreads,
        });
        if (shareData.preDialog[labelKey].glue) {
            addElement(itemList, "<>", labelKey, paramNames, { isNewLine, isHashtagScript, isThreads });
        }
        delete shareData.preDialog[labelKey];
    }
    if (rootList.includes("visit")) {
        let item = parserSwitch<T>(
            rootList as any,
            addSwitchElemen,
            addLabels,
            labelKey,
            shareData,
            paramNames,
            nestedId,
        );
        if (item) {
            if (!isNewLine && itemList.length > 0) {
                addElement(itemList, "<>", labelKey, paramNames, { isNewLine, isHashtagScript, isThreads });
            }
            addElement(itemList, item, labelKey, paramNames, { isNewLine, isHashtagScript, isThreads });
        }
        return;
    }
    let firstItem = rootList[0];
    if (firstItem && typeof firstItem === "object" && "temp=" in firstItem) {
        while (rootList[0] && typeof rootList[0] === "object" && "temp=" in (rootList[0] as any)) {
            paramNames.push((rootList[0] as any)["temp="]);
            rootList.shift();
        }
        paramNames = paramNames.reverse();
    }
    rootList.forEach((rootItem, index) => {
        if (isHashtagScript) {
            if (typeof rootItem === "string" && rootItem == "/#") {
                let myList: T[] = [];
                parseLabel(
                    commentList,
                    labelKey,
                    shareData,
                    myList,
                    addSwitchComment as any,
                    addSwitchComment as any,
                    addLabels,
                    addChoiseList,
                    nestedId,
                    isNewLine,
                );
                addElement(itemList, myList as any, labelKey, paramNames, {
                    isNewLine: isNewLine,
                    isHashtagScript: isHashtagScript,
                    isThreads: isThreads,
                });
                isHashtagScript = false;
                commentList = [];
            } else {
                commentList.push(rootItem);
            }
            return;
        } else if (isInEnv) {
            if (Array.isArray(rootItem)) {
                envList.push(rootItem);
            } else if (rootItem && typeof rootItem === "object") {
                if ("CNT?" in rootItem) {
                    if (index > 0 && rootList[index - 1] == "ev") {
                        isConditionalText = true;
                        conditionalList.push(rootItem);
                    } else if (isConditionalText) {
                        conditionalList.push(rootItem);
                    } else {
                        envList.push(rootItem);
                        isNewLine = false;
                    }
                } else if ("VAR=" in rootItem || "temp=" in rootItem) {
                    let obj = getSetValue(
                        "VAR=" in rootItem ? rootItem["VAR="] : rootItem["temp="],
                        paramNames,
                        rootList[index - 1],
                        "VAR=" in rootItem ? "storage" : "tempstorage",
                    );
                    if (obj.value && typeof obj.value === "string" && obj.value == "/str") {
                        obj.value = rootList[index - 2];
                    }
                    if (obj.value && typeof obj.value === "object" && "^->" in obj.value) {
                        obj.value = (obj.value as any)["^->"];
                    }
                    if (envList.length > 1) {
                        let arm = arithmeticParser(envList as any, labelKey, paramNames);
                        envList = [];
                        if (
                            arm &&
                            typeof arm === "object" &&
                            "type" in arm &&
                            arm.type == "value" &&
                            "storageType" in arm &&
                            arm.storageType == "logic"
                        ) {
                            obj.value = arm.operation as any;
                        }
                    }
                    if (typeof obj.key !== "string" || !obj.key.includes("$r")) {
                        addElement(itemList, obj, labelKey, paramNames, { isNewLine, isHashtagScript, isThreads });
                        isNewLine = true;
                    }
                } else if ("VAR?" in rootItem) {
                    envList.push(rootItem);
                } else if ("^->" in rootItem) {
                    let i: string = rootItem["^->"] as any;
                    if (!i.includes("$r")) {
                        envList.push(rootItem);
                    }
                }
            } else {
                if (typeof rootItem === "string" && rootItem == "/ev") {
                    if (isConditionalText) {
                        conditionalList.push(rootItem);
                    }
                    isInEnv = false;
                    envList.push(rootItem);
                } else if (typeof rootItem === "string" && rootItem == "out") {
                    if (envList.length > 0) {
                        let lastValue = envList[envList.length - 1];
                        if (lastValue && typeof lastValue === "object" && "VAR?" in lastValue) {
                            envList.pop();
                            let obj = getValue(lastValue["VAR?"], paramNames, "storage");
                            addElement(itemList, obj, labelKey, paramNames, { isNewLine, isHashtagScript, isThreads });
                        } else {
                            let varList = [];
                            while (envList.length > 0 && envList[envList.length - 1] != "/ev") {
                                varList.push(envList.pop());
                            }
                            varList = varList.reverse();
                            let value = arithmeticParser(varList as any, labelKey, paramNames);
                            envList = [];
                            if (
                                value &&
                                typeof value === "object" &&
                                "type" in value &&
                                value.type == "value" &&
                                "storageType" in value &&
                                value.storageType == "logic"
                            ) {
                                addElement(
                                    itemList,
                                    {
                                        storageOperationType: "get",
                                        storageType: "logic",
                                        operation: value.operation as PixiVNJsonArithmeticOperations,
                                        type: "value",
                                    },
                                    labelKey,
                                    paramNames,
                                    { isNewLine, isHashtagScript, isThreads },
                                );
                            } else {
                                addElement(itemList, "<>", labelKey, paramNames, {
                                    isNewLine,
                                    isHashtagScript,
                                    isThreads,
                                });
                                value = `^${value}`;
                                addElement(itemList, value, labelKey, paramNames, {
                                    isNewLine,
                                    isHashtagScript,
                                    isThreads,
                                });
                            }
                        }
                        isNewLine = false;
                    }
                } else {
                    envList.push(rootItem);
                }
            }
        } else if (typeof rootItem === "string") {
            // Dialog
            if (rootItem.startsWith("^")) {
                addElement(itemList, rootItem, labelKey, paramNames, { isNewLine, isHashtagScript, isThreads });
                isNewLine = false;
            } else if (rootItem == "ev") {
                isInEnv = true;
            } else if (rootItem == "\n") {
                isNewLine = true;
            } else if (rootItem == "done" || rootItem == "end") {
                addElement(itemList, rootItem, labelKey, paramNames, { isNewLine, isHashtagScript, isThreads });
                isNewLine = false;
            } else if (rootItem == "<>") {
                addElement(itemList, rootItem, labelKey, paramNames, { isNewLine, isHashtagScript, isThreads });
                isNewLine = false;
            } else if (rootItem == "nop" && isConditionalText) {
                let res = getConditionalValue<T>(
                    conditionalList as any[],
                    addSwitchElemen,
                    addLabels,
                    labelKey,
                    shareData,
                    paramNames,
                    nestedId,
                );
                if (res) {
                    addElement(itemList, res, labelKey, paramNames, { isNewLine, isHashtagScript, isThreads });
                }
                isConditionalText = false;
                conditionalList = [];
            } else if (rootItem == "#") {
                isHashtagScript = true;
            } else if (rootItem == "thread") {
                isThreads = true;
            }
        } else if (rootItem instanceof Array) {
            if (isConditionalText) {
                conditionalList.push(rootItem);
            } else if (
                rootItem.length > 1 &&
                typeof rootItem[rootItem.length - 2] === "object" &&
                rootItem[rootItem.length - 2] &&
                "c" in (rootItem as any)[rootItem.length - 2] &&
                typeof rootItem[rootItem.length - 1] === "object" &&
                rootItem[rootItem.length - 1] &&
                "b" in (rootItem as any)[rootItem.length - 1]
            ) {
                envList.pop();
                let list = [];
                let item = [];
                while (envList.length > 0 && envList[envList.length - 1] != "/ev") {
                    list.push(envList.pop() as any);
                }
                conditionalList = [...conditionalList, ...list.reverse()];
                isConditionalText = true;
                item.push(rootItem.pop());
                item.push(rootItem.pop());
                conditionalList = [...conditionalList, ...rootItem];
                conditionalList.push(item as any);
            } else if (
                rootItem.length > 1 &&
                typeof rootItem[rootItem.length - 1] === "object" &&
                rootItem[rootItem.length - 1] &&
                "#n" in (rootItem as any[])[rootItem.length - 1]
            ) {
                let el = rootItem.pop() as ContainerTypeN | undefined;
                if (!el) {
                    logger.error("Error parsing ink file: el is undefined");
                    return;
                }
                let newLabelKey = el["#n"];
                delete (el as any)["#n"];
                rootItem.push(el);
                addElement(
                    itemList,
                    { "->": labelKey ? labelKey + CHOISE_LABEL_KEY_SEPARATOR + newLabelKey : newLabelKey },
                    labelKey,
                    paramNames,
                    { isNewLine, isHashtagScript, isThreads },
                );
                addLabels(
                    {
                        [newLabelKey]: rootItem,
                    },
                    labelKey,
                    shareData,
                );
            } else {
                parseLabel(
                    rootItem,
                    labelKey,
                    shareData,
                    itemList,
                    addElement,
                    addSwitchElemen,
                    addLabels,
                    addChoiseList,
                    nestedId,
                    isNewLine,
                    paramNames,
                );
            }
        } else if (rootItem && typeof rootItem === "object") {
            if (
                "->" in rootItem &&
                typeof rootItem["->"] === "string" &&
                // {->: '.^.^.2.s'}
                !new RegExp(/^\.\^\.\^\.\d\.s$/).test(rootItem["->"])
            ) {
                let params = [];
                if (envList.length > 0) {
                    params = getParam(["ev", ...envList], labelKey, paramNames);
                }
                rootItem["params"] = params;
                addElement(itemList, rootItem, labelKey, paramNames, { isNewLine, isHashtagScript, isThreads });
                isNewLine = false;
            } else if ("*" in rootItem && typeof rootItem["*"] === "string") {
                if (rootItem["*"].includes("c")) {
                    envList.push(rootItem);
                    isNewLine = false;
                }
            }
            // if is choise info
            else if ("s" in rootItem && rootItem["s"] instanceof Array) {
                envList.push(rootItem);
                isNewLine = false;
            } else if ("CNT?" in rootItem) {
                envList.push(rootItem);
                isNewLine = false;
            } else if ("VAR=" in rootItem || "temp=" in rootItem) {
                let varList = [];
                let obj = getSetValue(
                    "VAR=" in rootItem ? rootItem["VAR="] : rootItem["temp="],
                    paramNames,
                    undefined,
                    "VAR=" in rootItem ? "storage" : "tempstorage",
                );
                if (obj.key !== "$r") {
                    envList.pop();
                    if (envList[envList.length - 1] == "/ev") {
                        envList.pop();
                    }
                    while (envList.length > 0 && envList[envList.length - 1] != "/ev") {
                        varList.push(envList.pop());
                    }
                    varList = varList.reverse();
                    obj.value = arithmeticParser(varList as any, labelKey, paramNames);
                    envList = [];
                    if (obj.value !== undefined || obj.value !== null) {
                        addElement(itemList, obj, labelKey, paramNames, { isNewLine, isHashtagScript, isThreads });
                    }
                    isNewLine = false;
                }
            } else {
                addLabels(rootItem, labelKey, shareData);
            }
        }
    });
    addChoiseList(envList, itemList, labelKey, shareData, paramNames);
    // * [Open the gate] -> paragraph_2
    if (labelKey.includes(CHOISE_LABEL_KEY_SEPARATOR) && itemList.length == 2) {
        let firstItem = itemList[0];
        let secondItem = itemList[1];
        if (
            firstItem &&
            secondItem &&
            typeof firstItem === "object" &&
            "dialogue" in firstItem &&
            typeof secondItem === "object" &&
            "labelToOpen" in secondItem &&
            firstItem.dialogue == " " &&
            secondItem.labelToOpen
        ) {
            // remove first step
            itemList.shift();
            delete (secondItem as any).glueEnabled;
            itemList[0] = secondItem;
        }
    }
    return;
}
