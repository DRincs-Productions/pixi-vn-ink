import { PixiVNJsonStepSwitchElementType } from '@drincs/pixi-vn';
import { CHOISE_LABEL_KEY_SEPARATOR } from '../../constant';
import InkRootType from '../../types/InkRootType';
import { StandardDivert } from '../../types/parserItems/Divert';
import RootParserItemType from '../../types/parserItems/RootParserItemType';
import { getConditionalValue } from '../ConditionalStatementsUtility';
import { addConditionalElementStep, addSwitchElemenStep } from '../ConditionalSubUtility';
import { getLabelByStandardDivert } from '../DivertUtility';
import { getSwitchValue } from '../SwitchUtility';

type ShareData = {
    preDialog: { [label: string]: { text: string } }
}
export function parseLabel<T>(
    rootList: RootParserItemType[],
    labelKey: string,
    shareData: ShareData,
    addElement: (list: T[], item: T | string | StandardDivert | PixiVNJsonStepSwitchElementType<T>, labelKey: string) => void,
    isNewLine: boolean = true,
    addLabels: (storyItem: InkRootType | RootParserItemType, dadLabelKey: string, shareData: ShareData) => void
) {
    let itemList: T[] = []
    let isInEnv = false
    let choiseList: RootParserItemType[] = []
    let isConditionalText = false
    let conditionalList: RootParserItemType[] = []
    if (shareData.preDialog[labelKey]) {
        addElement(itemList, "^" + shareData.preDialog[labelKey].text, labelKey)
        delete shareData.preDialog[labelKey]
        isNewLine = false
    }
    if (rootList.includes("visit")) {
        let item = getSwitchValue(rootList as any, addSwitchElemenStep, addConditionalElementStep, labelKey)
        if (item) {
            if (!isNewLine && itemList.length > 0) {
                itemList[itemList.length - 1].glueEnabled = true
                itemList[itemList.length - 1].goNextStep = true
            }
            addElement(itemList, shareData.preDialog[labelKey].text, labelKey)
            // TODO itemList.push({
            // TODO     conditionalStep: item,
            // TODO })
        }
        return
    }
    rootList.forEach((rootItem, index) => {
        if (isInEnv) {
            if (rootItem && typeof rootItem === "object" && "CNT?" in rootItem) {
                if (index > 0 && rootList[index - 1] == "ev") {
                    isConditionalText = true
                    conditionalList.push(rootItem)
                }
                else if (isConditionalText) {
                    conditionalList.push(rootItem)
                }
                else {
                    choiseList.push(rootItem)
                }
                isNewLine = false
            }
            else {
                if (typeof rootItem === "string" && rootItem == "/ev") {
                    if (isConditionalText) {
                        conditionalList.push(rootItem)
                    }
                    isInEnv = false
                    choiseList.push(rootItem)
                }
                else {
                    choiseList.push(rootItem)
                }
            }
        }
        else if (typeof rootItem === "string") {
            // Dialog
            if (rootItem.startsWith("^")) {
                if (!isNewLine && itemList.length > 0) {
                    // in this case: <> text
                    if (!itemList[itemList.length - 1].glueEnabled) {
                        itemList[itemList.length - 1].glueEnabled = true
                        itemList[itemList.length - 1].goNextStep = true
                    }
                }
                addElement(itemList, shareData.preDialog[labelKey].text, labelKey)
                isNewLine = false
            }
            else if (rootItem == "ev") {
                isInEnv = true
            }
            else if (rootItem == "\n") {
                isNewLine = true
            }
            else if (rootItem == "done" || rootItem == "end") {
                addElement(itemList, rootItem, labelKey)
                isNewLine = false
            }
            else if (rootItem == "<>") {
                if (itemList.length > 0) {
                    itemList[itemList.length - 1].glueEnabled = true
                    itemList[itemList.length - 1].goNextStep = true
                }
                else {
                    itemList.push({
                        glueEnabled: true,
                        goNextStep: true,
                    })
                }
                isNewLine = false
            }
            else if (rootItem == 'nop' && isConditionalText) {
                let res = getConditionalValue(conditionalList as any[], addConditionalElementStep, addSwitchElemenStep, labelKey)
                if (res) {
                    // TODO itemList.push({
                    // TODO     conditionalStep: res
                    // TODO })
                    addElement(itemList, rootItem, labelKey)
                }
                isConditionalText = false
                conditionalList = []
            }
        }
        else if (rootItem instanceof Array) {
            if (isConditionalText) {
                conditionalList.push(rootItem)
            }
            else {
                parseLabel(rootItem, labelKey, shareData, addElement, isNewLine, addLabels)
            }
        }
        else if (rootItem && typeof rootItem === "object") {
            if ("->" in rootItem && typeof rootItem["->"] === "string"
                // {->: '.^.^.2.s'}
                && !(new RegExp(/^\.\^\.\^\.\d\.s$/)).test(rootItem["->"])
            ) {
                let glueEnabled = isNewLine ? undefined : true
                let labelIdToOpen = getLabelByStandardDivert(rootItem["->"], labelKey)
                if (!isNewLine && itemList.length > 0) {
                    itemList[itemList.length - 1].goNextStep = true
                }
                itemList.push({
                    labelToOpen: {
                        label: labelIdToOpen,
                        type: "call",
                    },
                    glueEnabled: glueEnabled,
                })
                isNewLine = false
            }
            else if ("*" in rootItem && typeof rootItem["*"] === "string" && rootItem["*"].includes("c")) {
                choiseList.push(rootItem)
                isNewLine = false
            }
            // if is choise info
            else if ("s" in rootItem && rootItem["s"] instanceof Array) {
                choiseList.push(rootItem)
                isNewLine = false
            }
            else if ("CNT?" in rootItem) {
                choiseList.push(rootItem)
                isNewLine = false
            }
            else {
                addLabels(rootItem, labelKey, shareData)
            }
        }
    })
    if (choiseList.length > 0) {
        addLabels(choiseList, labelKey, shareData)
        // let choices: LabelChoiceRes = {}
        // getLabelChoice(choiseList as any, choices)
        // for (const [key, value] of Object.entries(choices)) {
        //     let newKey = labelKey + CHOISE_LABEL_KEY_SEPARATOR + key
        //     // if last step is choice
        //     let c: PixiVNJsonChoice = {
        //         text: value.text.length === 1 ? value.text[0] : value.text,
        //         label: newKey,
        //         props: {},
        //         type: "call",
        //         oneTime: value.onetime,
        //     }
        //     let choice = getConditional(c, value.conditions, labelKey) || c
        //     if (itemList.length > 0 && "choices" in itemList[itemList.length - 1] && itemList[itemList.length - 1].choices) {
        //         let choices = itemList[itemList.length - 1].choices
        //         if (choices && Array.isArray(choices)) {
        //             choices.push(choice)
        //         }
        //         else {
        //             console.error("[Pixi’VN Ink] Unhandled case: choices is PixiVNJsonConditionalStatements<PixiVNJsonChoices> | undefined", value, choices)
        //         }
        //         itemList[itemList.length - 1].choices = choices
        //     }
        //     else {
        //         itemList.push({
        //             choices: [choice]
        //         })
        //     }
        //     if (value.preDialog) {
        //         shareData.preDialog[newKey] = {
        //             text: value.preDialog.text
        //         }
        //     }
        // }
    }
    // * [Open the gate] -> paragraph_2
    if (labelKey.includes(CHOISE_LABEL_KEY_SEPARATOR) && itemList.length == 2
        && itemList[0].dialogue == " " && itemList[1].labelToOpen
    ) {
        // remove first step
        itemList.shift()
        itemList[0].glueEnabled = undefined
    }
}
