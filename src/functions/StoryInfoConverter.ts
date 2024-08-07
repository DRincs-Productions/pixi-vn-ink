import InkRootType from '../types/InkRootType';
import RootParserItemType from '../types/parserItems/RootParserItemType';
import { getLabelC } from './ChoiceInfoConverter';
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

function addLabels(storyItem: object, result: { [labelId: string]: StepLabelJsonType[] }) {
    if (storyItem === null) {
        return
    }
    // for value and key in item
    for (const [key, value] of Object.entries(storyItem)) {
        // if value is an array
        if (value instanceof Array) {
            let labels: StepLabelJsonType[] = []
            let subLabels: { [labelId: string]: StepLabelJsonType[] } = {}
            getLabel(value, labels, subLabels)
            for (const [subKey, value] of Object.entries(subLabels)) {
                result[key + "-" + subKey] = value
            }
            if (labels.length > 0) {
                result[key] = labels
            }
        }
    }
}

function getLabel(items: any[], labels: StepLabelJsonType[], subLabels: { [labelId: string]: StepLabelJsonType[] }) {
    items.forEach((v) => {
        if (typeof v === "string") {
            // Dialog
            if (v.startsWith("^")) {
                labels.push({
                    dialog: v.substring(1)
                })
            }
        }
        else if (v instanceof Array) {
            let c = getLabelC(v)
            getLabel(v, labels, subLabels)
        }
        else if (typeof v === "object") {
            addLabels(v, subLabels)
        }
    })
}
