import InkRootType from '../types/InkRootType';
import RootParserItemType from '../types/parserItems/RootParserItemType';
import { getLabelChoice } from './ChoiceInfoConverter';
import { StepLabelJsonType } from './InkToPixivn';

export function getInkLabel(story: InkRootType[]): { [labelId: string]: StepLabelJsonType[] } | undefined {
    try {
        let label: { [labelId: string]: StepLabelJsonType[] } = {}

        findLabel(story, label)

        return label;
    } catch (e) {
        console.error("[Pixi'VN Ink] Error parsing ink file", e)
    }
}

function findLabel(story: RootParserItemType[], labels: { [labelId: string]: StepLabelJsonType[] }) {
    for (const storyItem of story) {
        if (typeof storyItem === "object") {
            if (storyItem instanceof Array) {
                findLabel(storyItem, labels)
            }
            else if (storyItem === null) {
            }
            // is object
            else if (typeof storyItem === "object") {
                addLabels(storyItem, labels)
            }
            else {
                console.log(storyItem)
            }
        }
    }
}

function addLabels(storyItem: object, result: { [labelId: string]: StepLabelJsonType[] }, dadLabelKey: string = "") {
    if (storyItem === null) {
        return
    }
    // for value and key in item
    for (const [key, value] of Object.entries(storyItem)) {
        // if value is an array
        if (value instanceof Array) {
            let labels: StepLabelJsonType[] = []
            let subLabels: { [labelId: string]: StepLabelJsonType[] } = {}
            let labelName = (dadLabelKey ? dadLabelKey + "_" : "") + key
            getLabel(value, labelName, labels, subLabels)
            for (const [subKey, subValue] of Object.entries(subLabels)) {
                result[subKey] = subValue
            }
            if (labels.length > 0) {
                result[labelName] = labels
            }
        }
    }
}

function getLabel(items: any[], labelKey: string, labels: StepLabelJsonType[], subLabels: { [labelId: string]: StepLabelJsonType[] }) {
    items.forEach((v, index) => {
        if (typeof v === "string") {
            // Dialog
            if (v.startsWith("^")) {
                labels.push({
                    dialog: v.substring(1)
                })
            }
            else if (v == "ev") {
                // get all item after "ev"
                let nextItems = items.slice(index)
                let list: {
                    text: string;
                    label: string;
                }[] = []
                getLabelChoice(nextItems, list)
                list.forEach((c) => {
                    labels.push({
                        currentChoiceMenuOptions: {
                            text: c.text,
                            // TODO: get label
                            label: labelKey + "_" + c.label
                        } as any
                    })
                })
                return
            }
        }
        else if (v instanceof Array) {
            getLabel(v, labelKey, labels, subLabels)
        }
        else if (typeof v === "object") {
            addLabels(v, subLabels, labelKey)
        }
    })
}
