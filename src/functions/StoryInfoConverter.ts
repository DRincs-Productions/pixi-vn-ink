import { PixiVNJsonLabel, PixiVNJsonLabels } from '@drincs/pixi-vn';
import { CHOISE_LABEL_KEY_SEPARATOR } from '../constant';
import { addSwitchElemenStep } from '../parser/AddingElements';
import { parseLabel, ShareDataParserLabel } from '../parser/LabelParser';
import InkRootType from '../types/InkRootType';
import RootParserItemType from '../types/parserItems/RootParserItemType';
import { addChoiseIntoList } from './ChoiceInfoConverter';

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

export function addLabels(
    storyItem: InkRootType | RootParserItemType,
    result: PixiVNJsonLabels,
    dadLabelKey: string = "",
    shareData: ShareDataParserLabel = { preDialog: {} }
) {
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
            // if (key.includes("g-")) {
            //     labelName = dadLabelKey.split(CHOISE_LABEL_KEY_SEPARATOR)[0] + CHOISE_LABEL_KEY_SEPARATOR + key
            // }
            parseLabel(value, labelName, shareData, labels, addSwitchElemenStep, addSwitchElemenStep, (storyItem, dadLabelKey, shareData) => {
                addLabels(storyItem, subLabels, dadLabelKey, shareData)
            }, addChoiseIntoList)
            for (const [subKey, subValue] of Object.entries(subLabels)) {
                result[subKey] = subValue
            }
            if (labels.length > 0) {
                result[labelName] = labels
            }
        }
    }
}
