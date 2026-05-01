import type VariableReference from "@/interfaces/parserItems/VariableReference";
import type {
    PixiVNJsonChoice,
    PixiVNJsonChoices,
    PixiVNJsonConditionalStatements,
    PixiVNJsonLabelStep,
} from "@drincs/pixi-vn-json";
import { CHOISE_LABEL_KEY_SEPARATOR } from "../constant";
import type LabelChoiceRes from "../interfaces/LabelChoiceRes";
import type ChoicePoint from "../interfaces/parserItems/ChoicePoint";
import type { ChoiceInfo } from "../interfaces/parserItems/ChoicePoint";
import type NativeFunctions from "../interfaces/parserItems/NativeFunctions";
import { nativeFunctions } from "../interfaces/parserItems/NativeFunctions";
import type ReadCount from "../interfaces/parserItems/ReadCount";
import type RootParserItemType from "../interfaces/parserItems/RootParserItemType";
import type TextType from "../interfaces/parserItems/TextType";
import { addSwitchElemenText, callOrJump } from "../parser/adding-elements";
import { parserConditionalStatements } from "../parser/conditional-statements-parser";
import type { ShareDataParserLabel } from "../parser/label-parser";
import { type ConditionalList, parserSwitch } from "../parser/switch-parser";
import { unionStringOrArray } from "../utils/array-utility";
import { logger } from "../utils/log-utility";
import { getText } from "../utils/text-utility";

export function addChoiseIntoList<T>(
    choiseList: RootParserItemType[],
    itemList: (T | PixiVNJsonConditionalStatements<T>)[],
    labelKey: string,
    shareData: ShareDataParserLabel,
    paramNames: string[],
) {
    if (choiseList.length > 0) {
        const choices: LabelChoiceRes = {};
        getLabelChoice(choiseList as any, choices, paramNames);
        for (const [key, value] of Object.entries(choices)) {
            const newKey = labelKey + CHOISE_LABEL_KEY_SEPARATOR + key;
            // if last step is choice
            const c: PixiVNJsonChoice = {
                text: value.text.length === 1 ? value.text[0] : value.text,
                label: newKey,
                props: {},
                type: callOrJump(newKey, false),
                oneTime: value.onetime,
            };
            if (value.text.length === 0) {
                c.onlyHaveNoChoice = true;
                c.autoSelect = true;
            }
            if (c.oneTime === false) {
                delete c.oneTime;
            }
            const choice =
                parserConditionalStatements(c, value.conditions, paramNames, labelKey) || c;
            let prevItem = itemList[itemList.length - 1];
            if (typeof prevItem === "object" && prevItem && "type" in prevItem) {
                prevItem = {
                    conditionalStep: prevItem,
                } as T;
            }
            if (
                itemList.length > 0 &&
                typeof prevItem === "object" &&
                prevItem &&
                "choices" in prevItem &&
                prevItem.choices
            ) {
                const choices = (prevItem as PixiVNJsonLabelStep).choices as PixiVNJsonChoices;
                if (choices && Array.isArray(choices)) {
                    choices.push(choice);
                } else {
                    logger.error(
                        "Unhandled case: choices is PixiVNJsonConditionalStatements<PixiVNJsonChoices> | undefined",
                        value,
                        choices,
                    );
                }
                prevItem.choices = choices.sort((a, b) => {
                    try {
                        const labelArrayA = (a as PixiVNJsonChoice).label.split(".");
                        const endA = labelArrayA[labelArrayA.length - 1].replaceAll(
                            ".",
                            CHOISE_LABEL_KEY_SEPARATOR,
                        );
                        const labelArrayB = (b as PixiVNJsonChoice).label.split(".");
                        const endB = labelArrayB[labelArrayB.length - 1].replaceAll(
                            ".",
                            CHOISE_LABEL_KEY_SEPARATOR,
                        );
                        if (endA.includes("c-") && endB.includes("c-")) {
                            const stringNumberA = endA.split("c-")[1];
                            const numberA = parseInt(stringNumberA);
                            const stringNumberB = endB.split("c-")[1];
                            const numberB = parseInt(stringNumberB);
                            return numberA - numberB;
                        }
                    } catch (error) {}
                    return 0;
                });
            } else {
                itemList.push({
                    choices: [choice],
                } as T);
            }
            if (value.preDialog) {
                shareData.preDialog[newKey] = {
                    ...value.preDialog,
                };
            }
        }
    }
}

export function getLabelChoice(
    items: (
        | TextType
        | ReadCount
        | NativeFunctions
        | ChoicePoint
        | ChoiceInfo
        | ConditionalList
        | VariableReference
    )[],
    result: LabelChoiceRes,
    paramNames: string[],
    lastLabel?: string,
) {
    const text: (string | PixiVNJsonConditionalStatements<string>)[] = [];
    let label: string = "";
    let preDialog: string = "";
    let onetime: boolean = false;
    const conditions: (ReadCount | NativeFunctions | VariableReference)[] = [];
    for (let index = 0; index < items.length; index++) {
        const rootItem = items[index];
        if (typeof rootItem === "string") {
            // Dialog
            if (rootItem.startsWith("^")) {
                text.push(getText(rootItem));
            } else if (nativeFunctions.includes(rootItem as NativeFunctions)) {
                conditions.push(rootItem as NativeFunctions);
            }
        } else if (Array.isArray(rootItem) && rootItem.includes("visit")) {
            const secondConditionalItem = parserSwitch<string>(
                rootItem,
                addSwitchElemenText,
                (_storyItem, _dadLabelKey, _shareData) => {},
                lastLabel,
                { preDialog: {} },
                paramNames,
            );
            text.push(secondConditionalItem);
        } else if (rootItem && typeof rootItem === "object") {
            // if is a choice
            if ("*" in rootItem && typeof rootItem["*"] && typeof rootItem["*"] === "string") {
                if (rootItem["*"].includes("c")) {
                    const l = `c${rootItem["*"].split("c")[1]}`;
                    label = l;
                    if (rootItem.flg & 0x10) {
                        onetime = true;
                    }
                }
            }
            // if is choise info
            else if ("s" in rootItem && Array.isArray(rootItem.s)) {
                const t = findChoiceText(rootItem.s);
                const glueEnabled = rootItem.s.includes("<>");
                if (t) {
                    if (lastLabel && result[lastLabel]) {
                        result[lastLabel].preDialog = { text: t, glue: glueEnabled };
                        result[lastLabel].text = unionStringOrArray(t, result[lastLabel].text);
                    } else {
                        text.push(t);
                        preDialog = t;
                    }
                }
            } else if ("CNT?" in rootItem) {
                conditions.push(rootItem);
            } else if ("VAR?" in rootItem) {
                conditions.push(rootItem);
            }
        } else {
            conditions.push(rootItem);
        }
        if (label) {
            if (result[label]) {
                result[label].text = unionStringOrArray<
                    string | (string | PixiVNJsonConditionalStatements<string>)
                >(text, result[label].text);
            } else {
                result[label] = {
                    text: text,
                    onetime: onetime,
                    conditions: conditions,
                };
            }
            if (preDialog) {
                result[label].preDialog = { text: preDialog, glue: false };
            }
            // split text and label
            const newListItem = items.slice(index + 1);
            getLabelChoice(newListItem, result, paramNames, label);
            return;
        }
    }
}

function findChoiceText(items: RootParserItemType[]): string | undefined {
    for (const item of items) {
        if (typeof item === "string") {
            if (item.startsWith("^")) {
                return getText(item);
            }
        } else if (Array.isArray(item)) {
            const res = findChoiceText(item);
            if (res) {
                return res;
            }
        }
    }
}
