import {
    PixiVNJsonChoice,
    PixiVNJsonChoices,
    PixiVNJsonConditionalStatements,
    PixiVNJsonLabelStep,
} from "@drincs/pixi-vn-json";
import { CHOISE_LABEL_KEY_SEPARATOR } from "../constant";
import { addSwitchElemenText } from "../parser/adding-elements";
import { parserConditionalStatements } from "../parser/conditional-statements-parser";
import { ShareDataParserLabel } from "../parser/label-parser";
import { ConditionalList, parserSwitch } from "../parser/switch-parser";
import LabelChoiceRes from "../types/LabelChoiceRes";
import ChoicePoint, { ChoiceInfo } from "../types/parserItems/ChoicePoint";
import NativeFunctions, { nativeFunctions } from "../types/parserItems/NativeFunctions";
import ReadCount from "../types/parserItems/ReadCount";
import RootParserItemType from "../types/parserItems/RootParserItemType";
import TextType from "../types/parserItems/TextType";
import { unionStringOrArray } from "../utils/array-utility";
import { getText } from "../utils/text-utility";
import { logger } from "./log-utility";

export function addChoiseIntoList<T>(
    choiseList: RootParserItemType[],
    itemList: (T | PixiVNJsonConditionalStatements<T>)[],
    labelKey: string,
    shareData: ShareDataParserLabel,
    paramNames: string[]
) {
    if (choiseList.length > 0) {
        let choices: LabelChoiceRes = {};
        getLabelChoice(choiseList as any, choices, paramNames);
        for (const [key, value] of Object.entries(choices)) {
            let newKey = labelKey + CHOISE_LABEL_KEY_SEPARATOR + key;
            // if last step is choice
            let c: PixiVNJsonChoice = {
                text: value.text.length === 1 ? value.text[0] : value.text,
                label: newKey,
                props: {},
                type: "jump",
                oneTime: value.onetime,
            };
            if (value.text.length === 0) {
                c.onlyHaveNoChoice = true;
                c.autoSelect = true;
            }
            if (c.oneTime === false) {
                delete c.oneTime;
            }
            let choice = parserConditionalStatements(c, value.conditions, paramNames, labelKey) || c;
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
                let choices = (prevItem as PixiVNJsonLabelStep).choices as PixiVNJsonChoices;
                if (choices && Array.isArray(choices)) {
                    choices.push(choice);
                } else {
                    logger.error(
                        "Unhandled case: choices is PixiVNJsonConditionalStatements<PixiVNJsonChoices> | undefined",
                        value,
                        choices
                    );
                }
                prevItem.choices = choices.sort((a, b) => {
                    try {
                        let labelArrayA = (a as PixiVNJsonChoice).label.split(".");
                        let endA = labelArrayA[labelArrayA.length - 1].replaceAll(".", CHOISE_LABEL_KEY_SEPARATOR);
                        let labelArrayB = (b as PixiVNJsonChoice).label.split(".");
                        let endB = labelArrayB[labelArrayB.length - 1].replaceAll(".", CHOISE_LABEL_KEY_SEPARATOR);
                        if (endA.includes("c-") && endB.includes("c-")) {
                            let stringNumberA = endA.split("c-")[1];
                            let numberA = parseInt(stringNumberA);
                            let stringNumberB = endB.split("c-")[1];
                            let numberB = parseInt(stringNumberB);
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
    items: (TextType | ReadCount | NativeFunctions | ChoicePoint | ChoiceInfo | ConditionalList)[],
    result: LabelChoiceRes,
    paramNames: string[],
    lastLabel?: string
) {
    let text: (string | PixiVNJsonConditionalStatements<string>)[] = [];
    let label: string = "";
    let preDialog: string = "";
    let onetime: boolean = false;
    let condition: (ReadCount | NativeFunctions)[] = [];
    for (let index = 0; index < items.length; index++) {
        let rootItem = items[index];
        if (typeof rootItem === "string") {
            // Dialog
            if (rootItem.startsWith("^")) {
                text.push(getText(rootItem));
            } else if (nativeFunctions.includes(rootItem as NativeFunctions)) {
                condition.push(rootItem as NativeFunctions);
            }
        } else if (Array.isArray(rootItem) && rootItem.includes("visit")) {
            let secondConditionalItem = parserSwitch<string>(
                rootItem,
                addSwitchElemenText,
                (_storyItem, _dadLabelKey, _shareData) => {},
                lastLabel,
                { preDialog: {} },
                paramNames
            );
            text.push(secondConditionalItem);
        } else if (rootItem && typeof rootItem === "object") {
            // if is a choice
            if ("*" in rootItem && typeof rootItem["*"] && typeof rootItem["*"] === "string") {
                if (rootItem["*"].includes("c")) {
                    let l = "c" + rootItem["*"].split("c")[1];
                    label = l;
                    if (rootItem.flg & 0x10) {
                        onetime = true;
                    }
                }
            }
            // if is choise info
            else if ("s" in rootItem && rootItem["s"] instanceof Array) {
                let t = findChoiceText(rootItem["s"]);
                let glueEnabled = rootItem["s"].includes("<>");
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
                condition.push(rootItem);
            }
        } else {
            condition.push(rootItem);
        }
        if (label) {
            if (result[label]) {
                result[label].text = unionStringOrArray<string | (string | PixiVNJsonConditionalStatements<string>)>(
                    text,
                    result[label].text
                );
            } else {
                result[label] = {
                    text: text,
                    onetime: onetime,
                    conditions: condition,
                };
            }
            if (preDialog) {
                result[label].preDialog = { text: preDialog, glue: false };
            }
            // split text and label
            let newListItem = items.slice(index + 1);
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
        } else if (item instanceof Array) {
            let res = findChoiceText(item);
            if (res) {
                return res;
            }
        }
    }
}
