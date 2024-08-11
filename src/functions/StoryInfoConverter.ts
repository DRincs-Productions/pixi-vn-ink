import { LabelJsonType, StepLabelJsonType } from '@drincs/pixi-vn';
import { CHOISE_LABEL_KEY_SEPARATOR } from '../constant';
import InkRootType from '../types/InkRootType';
import LabelChoiceRes from '../types/LabelChoiceRes';
import RootParserItemType from '../types/parserItems/RootParserItemType';
import { getLabelChoice } from './ChoiceInfoConverter';
import { unionStringOrArray } from './utility';

export function getInkLabel(story: InkRootType[]): LabelJsonType | undefined {
    try {
        let label: LabelJsonType = {}

        findLabel(story, label)

        return label;
    } catch (e) {
        console.error("[Pixi’VN Ink] Error parsing ink file", e)
    }
}

function findLabel(story: RootParserItemType[], labels: LabelJsonType) {
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

function addLabels(storyItem: object, result: LabelJsonType, dadLabelKey: string = "", shareData: ShareData = { preDialog: {} }) {
    if (storyItem === null) {
        return
    }
    // for value and key in item
    for (const [key, value] of Object.entries(storyItem)) {
        // if value is an array
        if (value instanceof Array) {
            let labels: StepLabelJsonType[] = []
            let subLabels: LabelJsonType = {}
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
function getLabel(items: any[], labelKey: string, labelSteps: StepLabelJsonType[], subLabels: LabelJsonType, shareData: ShareData, isNewLine: boolean = true) {
    let isInEnv = false
    let envList: any[] = []
    if (shareData.preDialog[labelKey]) {
        labelSteps.push({
            dialog: shareData.preDialog[labelKey].text
        })
        delete shareData.preDialog[labelKey]
        isNewLine = false
    }
    items.forEach((v) => {
        if (isInEnv) {
            envList.push(v)
            if (typeof v === "string" && v == "/ev") {
                isInEnv = false
            }
        }
        else if (typeof v === "string") {
            // Dialog
            if (v.startsWith("^")) {
                if (!isNewLine && labelSteps.length > 0) {
                    // in this case: <> text
                    if (labelSteps[labelSteps.length - 1].glueEnabled) {
                        labelSteps.push({
                            dialog: v.substring(1)
                        })
                    } else {
                        let newDialog = labelSteps[labelSteps.length - 1].dialog
                        // if is a string or an array
                        if (typeof newDialog === "string" || newDialog instanceof Array || !newDialog) {
                            labelSteps[labelSteps.length - 1].dialog = unionStringOrArray(newDialog, v.substring(1))
                        }
                        else {
                            newDialog.text = unionStringOrArray(newDialog.text, v.substring(1))
                            labelSteps[labelSteps.length - 1].dialog = newDialog
                        }
                    }
                } else {
                    labelSteps.push({
                        dialog: v.substring(1)
                    })
                }
                isNewLine = false
            }
            else if (v == "ev") {
                isInEnv = true
            }
            else if (v == "\n") {
                isNewLine = true
            }
            else if (v == "done") {
                labelSteps.push({
                    end: "label_end"
                })
                isNewLine = false
            }
            else if (v == "end") {
                labelSteps.push({
                    end: "game_end"
                })
                isNewLine = false
            }
            else if (v == "<>") {
                labelSteps.push({
                    glueEnabled: true,
                    goNextStep: true,
                })
                isNewLine = false
            }
        }
        else if (v instanceof Array) {
            getLabel(v, labelKey, labelSteps, subLabels, shareData, isNewLine)
        }
        else if (v && typeof v === "object") {
            if ("->" in v && typeof v["->"] === "string"
                // {->: '.^.^.2.s'}
                && !(new RegExp(/^\.\^\.\^\.\d\.s$/)).test(v["->"])
            ) {
                let labelIdToOpen = v["->"]
                let glueEnabled = isNewLine ? undefined : true
                let goNextStep = isNewLine ? undefined : true
                if (
                    // if there are a sub label "=label"
                    (new RegExp(/^\.\^\.\^\.\^\.\^\..*$/)).test(v["->"])
                    && labelKey
                ) {
                    let endOfLabel = v["->"].substring(9)
                    labelIdToOpen = labelKey.split(CHOISE_LABEL_KEY_SEPARATOR)[0] + CHOISE_LABEL_KEY_SEPARATOR + endOfLabel
                    goNextStep = true
                }
                else if (
                    // if there are a sub label "=label"
                    (new RegExp(/^\.\^\.\^\.\^\..*$/)).test(v["->"])
                    && labelKey.includes(CHOISE_LABEL_KEY_SEPARATOR)
                ) {
                    let endOfLabel = v["->"].substring(7)
                    labelIdToOpen = labelKey.split(CHOISE_LABEL_KEY_SEPARATOR)[0] + CHOISE_LABEL_KEY_SEPARATOR + endOfLabel
                }
                else if (
                    // if there are a sub label "=label"
                    (new RegExp(/^\.\^\..*$/)).test(v["->"])
                    && labelKey
                ) {
                    let endOfLabel = v["->"].substring(3)
                    labelIdToOpen = labelKey + CHOISE_LABEL_KEY_SEPARATOR + endOfLabel
                    goNextStep = true
                }
                labelSteps.push({
                    labelToOpen: {
                        labelId: labelIdToOpen,
                        type: "call",
                    },
                    glueEnabled: glueEnabled,
                    goNextStep: goNextStep,
                })
                isNewLine = false
            }
            else if ("*" in v && typeof v["*"] === "string" && v["*"].includes("c")) {
                envList.push(v)
                isNewLine = false
            }
            // if is choise info
            else if ("s" in v && v["s"] instanceof Array) {
                envList.push(v)
                isNewLine = false
            }
            else {
                addLabels(v, subLabels, labelKey, shareData)
            }
        }
    })
    if (envList.length > 0) {
        let choices: LabelChoiceRes = {}
        getLabelChoice(envList, choices)
        for (const [key, value] of Object.entries(choices)) {
            let newKey = labelKey + CHOISE_LABEL_KEY_SEPARATOR + key
            // if last step is choice
            if (labelSteps.length > 0 && "choices" in labelSteps[labelSteps.length - 1]) {
                labelSteps[labelSteps.length - 1].choices?.push({
                    text: value.text,
                    label: newKey,
                    props: {},
                    type: "call"
                })
            }
            else {
                labelSteps.push({
                    choices: [{
                        text: value.text,
                        label: newKey,
                        props: {},
                        type: "call"
                    }]
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
        && labelSteps[0].dialog == " " && labelSteps[1].labelToOpen
    ) {
        // remove first step
        labelSteps.shift()
        labelSteps[0].glueEnabled = undefined
    }
}
