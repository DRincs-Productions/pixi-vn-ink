import { PixiVNJsonLabel, PixiVNJsonLabels } from '@drincs/pixi-vn';
import { PixiVNJsonChoice } from '@drincs/pixi-vn/dist/interface/PixiVNJsonLabelStep';
import { CHOISE_LABEL_KEY_SEPARATOR } from '../constant';
import InkRootType from '../types/InkRootType';
import LabelChoiceRes from '../types/LabelChoiceRes';
import RootParserItemType from '../types/parserItems/RootParserItemType';
import { getLabelChoice } from './ChoiceInfoConverter';
import { getConditional, getConditionalValue } from './ConditionalStatementsUtility';
import { addSwitchElemenStep } from './ConditionalSubUtility';
import { getLabelByStandardDivert } from './DivertUtility';
import { getSwitchValue } from './SwitchUtility';

export function getInkLabel(story: (InkRootType | RootParserItemType | RootParserItemType[])[]): PixiVNJsonLabels | undefined {
    try {
        let label: PixiVNJsonLabels = {}

        findLabel(story, label)

        return label;
    } catch (e) {
        console.error("[Pixi’VN Ink] Error parsing ink file", e)
    }
}

function findLabel(story: (InkRootType | RootParserItemType | RootParserItemType[])[], labels: PixiVNJsonLabels) {
    for (const storyItem of story) {
        if (storyItem) {
            if (storyItem instanceof Array) {
                findLabel(storyItem, labels)
            }
            else if (typeof storyItem === "object") {
                addLabels(storyItem, labels)
            }
        }
    }
}

function addLabels(storyItem: InkRootType | RootParserItemType, result: PixiVNJsonLabels, dadLabelKey: string = "", shareData: ShareData = { preDialog: {} }) {
    if (storyItem === null) {
        return
    }
    // for value and key in item
    for (const [key, value] of Object.entries(storyItem)) {
        // if value is an array
        if (value instanceof Array) {
            let labels: PixiVNJsonLabel = []
            let subLabels: PixiVNJsonLabels = {}
            let labelName = (dadLabelKey ? dadLabelKey + CHOISE_LABEL_KEY_SEPARATOR : "") + key
            getLabel(value, labelName, labels, subLabels, shareData)
            for (const [subKey, subValue] of Object.entries(subLabels)) {
                result[subKey] = subValue
            }
            if (labels.length > 0) {
                result[labelName] = labels
            }
        }
    }
}

type ShareData = {
    preDialog: { [label: string]: { text: string } }
}
function getLabel(rootList: RootParserItemType[], labelKey: string, labelSteps: PixiVNJsonLabel, subLabels: PixiVNJsonLabels, shareData: ShareData, isNewLine: boolean = true) {
    let isInEnv = false
    let choiseList: RootParserItemType[] = []
    let isConditionalText = false
    let conditionalList: RootParserItemType[] = []
    if (shareData.preDialog[labelKey]) {
        labelSteps.push({
            dialogue: shareData.preDialog[labelKey].text
        })
        delete shareData.preDialog[labelKey]
        isNewLine = false
    }
    if (rootList.includes("visit")) {
        let item = getSwitchValue(rootList as any, addSwitchElemenStep, labelKey)
        if (item) {
            if (!isNewLine && labelSteps.length > 0) {
                labelSteps[labelSteps.length - 1].glueEnabled = true
                labelSteps[labelSteps.length - 1].goNextStep = true
            }
            labelSteps.push({
                conditionalStep: item,
            })
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
                if (!isNewLine && labelSteps.length > 0) {
                    // in this case: <> text
                    if (labelSteps[labelSteps.length - 1].glueEnabled) {
                        labelSteps.push({
                            dialogue: rootItem.substring(1)
                        })
                    } else {
                        labelSteps[labelSteps.length - 1].glueEnabled = true
                        labelSteps[labelSteps.length - 1].goNextStep = true
                        labelSteps.push({
                            dialogue: rootItem.substring(1)
                        })
                    }
                } else {
                    labelSteps.push({
                        dialogue: rootItem.substring(1)
                    })
                }
                isNewLine = false
            }
            else if (rootItem == "ev") {
                isInEnv = true
            }
            else if (rootItem == "\n") {
                isNewLine = true
            }
            else if (rootItem == "done") {
                labelSteps.push({
                    end: "label_end"
                })
                isNewLine = false
            }
            else if (rootItem == "end") {
                labelSteps.push({
                    end: "game_end"
                })
                isNewLine = false
            }
            else if (rootItem == "<>") {
                if (labelSteps.length > 0) {
                    labelSteps[labelSteps.length - 1].glueEnabled = true
                    labelSteps[labelSteps.length - 1].goNextStep = true
                }
                else {
                    labelSteps.push({
                        glueEnabled: true,
                        goNextStep: true,
                    })
                }
                isNewLine = false
            }
            else if (rootItem == 'nop' && isConditionalText) {
                let res = getConditionalValue(conditionalList as any[], addSwitchElemenStep, labelKey)
                if (res) {
                    labelSteps.push({
                        conditionalStep: res
                    })
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
                getLabel(rootItem, labelKey, labelSteps, subLabels, shareData, isNewLine)
            }
        }
        else if (rootItem && typeof rootItem === "object") {
            if ("->" in rootItem && typeof rootItem["->"] === "string"
                // {->: '.^.^.2.s'}
                && !(new RegExp(/^\.\^\.\^\.\d\.s$/)).test(rootItem["->"])
            ) {
                let glueEnabled = isNewLine ? undefined : true
                let labelIdToOpen = getLabelByStandardDivert(rootItem["->"], labelKey)
                if (!isNewLine && labelSteps.length > 0) {
                    labelSteps[labelSteps.length - 1].goNextStep = true
                }
                labelSteps.push({
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
                addLabels(rootItem, subLabels, labelKey, shareData)
            }
        }
    })
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
            if (labelSteps.length > 0 && "choices" in labelSteps[labelSteps.length - 1] && labelSteps[labelSteps.length - 1].choices) {
                let choices = labelSteps[labelSteps.length - 1].choices
                if (choices && Array.isArray(choices)) {
                    choices.push(choice)
                }
                else {
                    console.error("[Pixi’VN Ink] Unhandled case: choices is PixiVNJsonConditionalStatements<PixiVNJsonChoices> | undefined", value, choices)
                }
                labelSteps[labelSteps.length - 1].choices = choices
            }
            else {
                labelSteps.push({
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
    // * [Open the gate] -> paragraph_2
    if (labelKey.includes(CHOISE_LABEL_KEY_SEPARATOR) && labelSteps.length == 2
        && labelSteps[0].dialogue == " " && labelSteps[1].labelToOpen
    ) {
        // remove first step
        labelSteps.shift()
        labelSteps[0].glueEnabled = undefined
    }
}
