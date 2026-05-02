import { CHOISE_LABEL_KEY_SEPARATOR, SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES } from "@/constant";
import { addChoiseIntoList } from "@/functions/choice-info-converter";
import type InkRootType from "@/interfaces/InkRootType";
import type RootParserItemType from "@/interfaces/parserItems/RootParserItemType";
import { addSwitchElemenStep, addSwitchElemenText } from "@/parser/adding-elements";
import { parseLabel, type ShareDataParserLabel } from "@/parser/label-parser";
import { type ConditionalList, parserSwitch } from "@/parser/switch-parser";
import { logger } from "@/utils/log-utility";
import type {
    PixiVNJsonLabels,
    PixiVNJsonLabelStep,
    PixiVNJsonStepSwitch,
} from "@drincs/pixi-vn-json";

export function getInkLabels(
    story: (InkRootType | RootParserItemType | RootParserItemType[])[],
    options: {
        functions?: { name: string; args: number }[];
    },
): PixiVNJsonLabels | undefined {
    try {
        const label: PixiVNJsonLabels = {};

        findLabel(story, label, options);

        return label;
    } catch (e) {
        logger.error("Error parsing ink file", e);
    }
}

function findLabel(
    story: (InkRootType | RootParserItemType | RootParserItemType[])[],
    labels: PixiVNJsonLabels,
    sharedVariables: {
        externalSwitch?: PixiVNJsonStepSwitch<string>;
        functions?: { name: string; args: number }[];
    } = {},
) {
    for (const storyItem of story) {
        if (storyItem) {
            if (Array.isArray(storyItem)) {
                if (storyItem.includes("visit")) {
                    const item = parserSwitch<string>(
                        storyItem as ConditionalList,
                        addSwitchElemenText,
                        (_storyItem, _dadLabelKey, _shareData) => {},
                        "",
                        { preDialog: {}, functions: sharedVariables.functions || [] },
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
    shareData: ShareDataParserLabel = { preDialog: {}, functions: [] },
) {
    if (storyItem === null) {
        return;
    }
    // for value and key in item
    for (const [key, value] of Object.entries(storyItem)) {
        // if value is an array
        if (Array.isArray(value)) {
            const labels: PixiVNJsonLabelStep[] = [];
            const subLabels: PixiVNJsonLabels = {};
            const labelName = (dadLabelKey ? dadLabelKey + CHOISE_LABEL_KEY_SEPARATOR : "") + key;
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
