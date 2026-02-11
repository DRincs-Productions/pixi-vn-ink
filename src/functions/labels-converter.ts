import type { PixiVNJsonLabels, PixiVNJsonLabelStep, PixiVNJsonStepSwitch } from "@drincs/pixi-vn-json";
import { CHOISE_LABEL_KEY_SEPARATOR, SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES } from "../constant";
import InkRootType from "../interfaces/InkRootType";
import RootParserItemType from "../interfaces/parserItems/RootParserItemType";
import { addSwitchElemenStep, addSwitchElemenText } from "../parser/adding-elements";
import { parseLabel, ShareDataParserLabel } from "../parser/label-parser";
import { ConditionalList, parserSwitch } from "../parser/switch-parser";
import { logger } from "../utils/log-utility";
import { addChoiseIntoList } from "./choice-info-converter";

export function getInkLabels(
    story: (InkRootType | RootParserItemType | RootParserItemType[])[],
): PixiVNJsonLabels | undefined {
    try {
        let label: PixiVNJsonLabels = {};

        findLabel(story, label);

        return label;
    } catch (e) {
        logger.error("Error parsing ink file", e);
    }
}

function findLabel(
    story: (InkRootType | RootParserItemType | RootParserItemType[])[],
    labels: PixiVNJsonLabels,
    sharedVariables: { externalSwitch: PixiVNJsonStepSwitch<string> | undefined } = { externalSwitch: undefined },
) {
    for (const storyItem of story) {
        if (storyItem) {
            if (storyItem instanceof Array) {
                if (storyItem.includes("visit")) {
                    let item = parserSwitch<string>(
                        storyItem as ConditionalList,
                        addSwitchElemenText,
                        (_storyItem, _dadLabelKey, _shareData) => {},
                        "",
                        { preDialog: {} },
                        [],
                    );
                    if (item) {
                        sharedVariables.externalSwitch = item;
                    }
                } else {
                    findLabel(storyItem, labels, sharedVariables);
                }
            } else if (typeof storyItem === "object") {
                if (storyItem && "VAR=" in storyItem && sharedVariables.externalSwitch) {
                    if (!labels[SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES]) {
                        labels[SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES] = [];
                    }
                    labels[SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES].push({
                        operations: [
                            {
                                type: "value",
                                value: sharedVariables.externalSwitch as any,
                                key: storyItem["VAR="],
                                storageType: "storage",
                                storageOperationType: "set",
                            },
                        ],
                    });
                }
                addLabels(storyItem, labels);
            }
        }
    }
}

export function addLabels(
    storyItem: InkRootType | RootParserItemType,
    result: PixiVNJsonLabels,
    dadLabelKey: string = "",
    shareData: ShareDataParserLabel = { preDialog: {} },
) {
    if (storyItem === null) {
        return;
    }
    // for value and key in item
    for (const [key, value] of Object.entries(storyItem)) {
        // if value is an array
        if (value instanceof Array) {
            let labels: PixiVNJsonLabelStep[] = [];
            let subLabels: PixiVNJsonLabels = {};
            let labelName = (dadLabelKey ? dadLabelKey + CHOISE_LABEL_KEY_SEPARATOR : "") + key;
            // if (key.includes("g-")) {
            //     labelName = dadLabelKey.split(CHOISE_LABEL_KEY_SEPARATOR)[0] + CHOISE_LABEL_KEY_SEPARATOR + key
            // }
            parseLabel(
                value,
                labelName,
                shareData,
                labels,
                addSwitchElemenStep,
                addSwitchElemenStep,
                (storyItem, dadLabelKey, shareData) => {
                    addLabels(storyItem, subLabels, dadLabelKey, shareData);
                },
                addChoiseIntoList,
            );
            for (const [subKey, subValue] of Object.entries(subLabels)) {
                result[subKey] = subValue;
            }
            if (labels.length > 0) {
                result[labelName] = labels;
            }
        }
    }
}
