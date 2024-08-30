import { PixiVNJsonConditionalStatements, PixiVNJsonLabelStep } from '@drincs/pixi-vn';
import { PixiVNJsonChoice } from '@drincs/pixi-vn/dist/interface/PixiVNJsonLabelStep';
import { CHOISE_LABEL_KEY_SEPARATOR } from '../constant';
import LabelChoiceRes from '../types/LabelChoiceRes';
import ChoicePoint, { ChoiceInfo } from '../types/parserItems/ChoicePoint';
import NativeFunctions, { nativeFunctions } from '../types/parserItems/NativeFunctions';
import ReadCount from '../types/parserItems/ReadCount';
import RootParserItemType from '../types/parserItems/RootParserItemType';
import TextType from '../types/parserItems/TextType';
import { getConditional } from './ConditionalStatementsUtility';
import { addSwitchElemenText } from './ConditionalSubUtility';
import { ShareDataParserLabel } from './parser/LabelParser';
import { ConditionalList, getSwitchValue } from './SwitchUtility';
import { unionStringOrArray } from './utility';

export function addChoiseIntoList(
    choiseList: RootParserItemType[],
    itemList: (PixiVNJsonLabelStep | PixiVNJsonConditionalStatements<PixiVNJsonLabelStep>)[],
    labelKey: string,
    shareData: ShareDataParserLabel,
) {
    if (choiseList.length > 0) {
        let choices: LabelChoiceRes = {}
        getLabelChoice(choiseList as any, choices)
        for (const [key, value] of Object.entries(choices)) {
            let newKey = labelKey + CHOISE_LABEL_KEY_SEPARATOR + key
            // if last step is choice
            let c: PixiVNJsonChoice = {
                text: value.text.length === 1 ? value.text[0] : value.text,
                label: newKey,
                props: {},
                type: "call",
                oneTime: value.onetime,
            }
            let choice = getConditional(c, value.conditions, labelKey) || c
            let prevItem = itemList[itemList.length - 1]
            if (typeof prevItem === "object" && "type" in prevItem) {
                prevItem = {
                    conditionalStep: prevItem,
                }
            }
            if (itemList.length > 0 && "choices" in prevItem && prevItem.choices) {
                let choices = prevItem.choices
                if (choices && Array.isArray(choices)) {
                    choices.push(choice)
                }
                else {
                    console.error("[Pixi’VN Ink] Unhandled case: choices is PixiVNJsonConditionalStatements<PixiVNJsonChoices> | undefined", value, choices)
                }
                prevItem.choices = choices
            }
            else {
                itemList.push({
                    choices: [choice]
                })
            }
            if (value.preDialog) {
                shareData.preDialog[newKey] = {
                    text: value.preDialog.text
                }
            }
        }
    }
}

export function getLabelChoice(items: (TextType | ReadCount | NativeFunctions | ChoicePoint | ChoiceInfo | ConditionalList)[], result: LabelChoiceRes, lastLabel?: string) {
    let text: (string | PixiVNJsonConditionalStatements<string>)[] = []
    let label: string = ""
    let preDialog: string = ""
    let onetime: boolean = false
    let condition: (ReadCount | NativeFunctions)[] = []
    for (let index = 0; index < items.length; index++) {
        let rootItem = items[index]
        if (typeof rootItem === "string") {
            // Dialog
            if (rootItem.startsWith("^")) {
                text.push(rootItem.substring(1))
            }
            else if (nativeFunctions.includes(rootItem as NativeFunctions)) {
                condition.push(rootItem as NativeFunctions)
            }
        }
        else if (Array.isArray(rootItem) && rootItem.includes("visit")) {
            let secondConditionalItem = getSwitchValue<string>(rootItem, addSwitchElemenText, lastLabel)
            text.push(secondConditionalItem)
        }
        else if (rootItem && typeof rootItem === "object") {
            // if is a choice
            if ("*" in rootItem && typeof rootItem["*"] && typeof rootItem["*"] === "string" && rootItem["*"].includes("c")) {
                let l = "c" + rootItem["*"].split("c")[1]
                label = l
                if (rootItem.flg & 0x10) {
                    onetime = true
                }
            }
            // if is choise info
            else if ("s" in rootItem && rootItem["s"] instanceof Array) {
                let t = findChoiceText(rootItem["s"])
                if (t) {
                    if (lastLabel && result[lastLabel]) {
                        result[lastLabel].preDialog = { text: t }
                        result[lastLabel].text = unionStringOrArray(t, result[lastLabel].text)
                    }
                    else {
                        text.push(t)
                        preDialog = t
                    }
                }
            }
            else if ("CNT?" in rootItem) {
                condition.push(rootItem)
            }
        }
        else {
            condition.push(rootItem)
        }
        if (text.length > 0 && label) {
            if (result[label]) {
                result[label].text = unionStringOrArray<string | (string | PixiVNJsonConditionalStatements<string>)>(text, result[label].text)
            }
            else {
                result[label] = { text: text, onetime: onetime, conditions: condition }
            }
            if (preDialog) {
                result[label].preDialog = { text: preDialog }
            }
            // split text and label
            let newListItem = items.slice(index + 1)
            getLabelChoice(newListItem, result, label)
            return
        }
    }
}

function findChoiceText(items: RootParserItemType[]): string | undefined {
    for (const item of items) {
        if (typeof item === "string") {
            if (item.startsWith("^")) {
                return item.substring(1)
            }
        }
        else if (item instanceof Array) {
            let res = findChoiceText(item)
            if (res) {
                return res
            }
        }
    }
}
