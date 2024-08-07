import { ChoiceMenuOptionsType } from '@drincs/pixi-vn';
import InkStoryType from '../types/InkStoryType';
import RootParserItemType from '../types/parserItems/RootParserItemType';
import { getLabelC } from './ChoiceInfoConverter';
import { StepLabelJsonType } from './InkToPixivn';

export function getInkLabel(inkObj: InkStoryType): { [labelId: string]: StepLabelJsonType[] } | undefined {
    try {
        let label: { [labelId: string]: StepLabelJsonType[] } = {}

        findLabel(inkObj.root, label)

        return label;
    } catch (e) {
        console.error("[Pixi'VN Ink] Error parsing ink file", e)
    }
}

function findLabel(items: RootParserItemType[], labels: { [labelId: string]: StepLabelJsonType[] }) {
    for (const item of items) {
        if (typeof item === "object") {
            if (item instanceof Array) {
                findLabel(item, labels)
            }
            else if (item === null) {
            }
            // is object
            else if (typeof item === "object") {
                addLabels(item, labels)
            }
            else {
                console.log(item)
            }
        }
    }
}

function addLabels(item: object, labels: { [labelId: string]: StepLabelJsonType[] }, choise?: ChoiceMenuOptionsType<{}>) {
    if (item === null) {
        return
    }
    // for value and key in item
    for (const [key, value] of Object.entries(item)) {
        // if value is an array
        if (value instanceof Array) {
            let aaaa: StepLabelJsonType[] = []
            let subLabels: { [labelId: string]: StepLabelJsonType[] } = {}
            getLabel(value, aaaa, subLabels, choise)
            if (aaaa.length > 0) {
                labels[key] = aaaa
            }
        }
        else {
            console.log(value)
        }
    }
}

function getLabel(items: any[], labels: StepLabelJsonType[], subLabels: { [labelId: string]: StepLabelJsonType[] }, choise?: ChoiceMenuOptionsType<{}>) {
    items.forEach((v) => {
        if (typeof v === "string") {
            if (v.startsWith("^")) {
                labels.push({
                    // remove first character
                    dialog: v.substring(1)
                })
            }
        }
        // is array
        else if (v instanceof Array) {
            let c = getLabelC(v)
            if (choise instanceof Array) {
                getLabel(v, labels, subLabels, choise)
            }
            else {
                let choiseInt: ChoiceMenuOptionsType<{}> = []
                getLabel(v, labels, subLabels, choiseInt)
                labels.push({
                    currentChoiceMenuOptions: choiseInt
                })
            }
        }
        // if is object
        else if (typeof v === "object") {
            // if is a choice
            if (choise instanceof Array) {
                addLabels(v, subLabels, choise)
            }
            else {
                let choiseInt: ChoiceMenuOptionsType<{}> = []
                addLabels(v, subLabels, choiseInt)
            }
        }
        else {
            console.log("ignore", v)
        }
    })
}
