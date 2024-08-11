import { LabelJsonType, StepLabelJsonType } from '@drincs/pixi-vn';
import { CHOISE_LABEL_KEY_SEPARATOR } from '../constant';
import InkRootType from '../types/InkRootType';
import LabelChoiceRes from '../types/LabelChoiceRes';
import RootParserItemType from '../types/parserItems/RootParserItemType';
import { getLabelChoice } from './ChoiceInfoConverter';

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
                    labelSteps[labelSteps.length - 1].dialog = labelSteps[labelSteps.length - 1].dialog + v.substring(1)
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
        }
        else if (v instanceof Array) {
            getLabel(v, labelKey, labelSteps, subLabels, shareData, isNewLine)
        }
        else if (v && typeof v === "object") {
            if ("->" in v && typeof v["->"] === "string" && !v["->"].includes(".^.^.")) {
                labelSteps.push({
                    labelToOpen: {
                        labelId: v["->"],
                        type: "call",
                    },
                    glueEnabled: isNewLine ? undefined : true,
                    goNextStep: isNewLine ? undefined : true,
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
