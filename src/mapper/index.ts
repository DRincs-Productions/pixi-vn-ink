import {
    CHOISE_LABEL_KEY_SEPARATOR,
    GLOBAL_DECL,
    SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES,
} from "@/constant";
import type InkRootType from "@/interfaces/InkRootType";
import type InkStoryType from "@/interfaces/InkStoryType";
import type RootParserItemType from "@/interfaces/parserItems/RootParserItemType";
import { addSwitchElemenStep, addSwitchElemenText } from "@/mapper/adding-elements";
import { addChoiseIntoList } from "@/mapper/choice-info-converter";
import { parseLabel } from "@/mapper/label-parser";
import { type ConditionalList, parserSwitch } from "@/mapper/switch-parser";
import type { MapperSharedType } from "@/mapper/types";
import { getSetValue } from "@/mapper/value-utility";
import { logger } from "@/utils/log-utility";
import { PIXIVNJSON_SCHEMA_URL } from "@drincs/pixi-vn-json";
import type {
    PixiVNJson,
    PixiVNJsonLabels,
    PixiVNJsonLabelStep,
} from "@drincs/pixi-vn-json/schema";

export namespace InkMapper {
    export function inkToJson(
        obj: InkStoryType,
        shared: Partial<MapperSharedType> = {},
    ): PixiVNJson | undefined {
        const {
            labelToRemove = [],
            initialVarsToRemove = [],
            enums = {},
            functions = [],
            preDialog = {},
        } = shared;
        const result: PixiVNJson = {
            $schema: PIXIVNJSON_SCHEMA_URL,
        };
        result.labels = getInkLabels(obj.root, {
            labelToRemove,
            initialVarsToRemove,
            enums,
            functions,
            preDialog,
        });
        if (result.labels && GLOBAL_DECL in result.labels) {
            const global = result.labels[GLOBAL_DECL];
            delete result.labels[GLOBAL_DECL];
            global.forEach((item) => {
                if (item.operations) {
                    result.initialOperations = result.initialOperations
                        ? [...result.initialOperations, ...(item.operations as any)]
                        : [...item.operations];
                }
            });
        }
        if (result.labels && SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES in result.labels) {
            const global = result.labels[SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES];
            delete result.labels[SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES];
            global.forEach((item) => {
                if (item.operations) {
                    result.initialOperations = result.initialOperations
                        ? [...result.initialOperations, ...(item.operations as any)]
                        : [...item.operations];
                }
            });
        }

        labelToRemove.forEach((label) => {
            if (result.labels && label in result.labels) {
                delete result.labels[label];
            }
        });
        initialVarsToRemove.forEach((v) => {
            if (result.initialOperations) {
                result.initialOperations = result.initialOperations.filter((op) => {
                    if (op.type === "value") {
                        if (op.key === v) {
                            return false;
                        }
                    }
                    return true;
                });
            }
        });

        return result;
    }

    function getInkLabels(
        story: (InkRootType | RootParserItemType | RootParserItemType[])[],
        shared: MapperSharedType,
    ): PixiVNJsonLabels | undefined {
        try {
            const label: PixiVNJsonLabels = {};

            findLabel(story, label, shared);

            return label;
        } catch (e) {
            logger.error("Error parsing ink file", e);
        }
    }

    function findLabel(
        story: (InkRootType | RootParserItemType | RootParserItemType[])[],
        labels: PixiVNJsonLabels,
        shared: MapperSharedType,
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
                            shared,
                            [],
                        );
                        if (item) {
                            shared.externalSwitch = item;
                        }
                    } else {
                        findLabel(storyItem, labels, shared);
                    }
                } else if (typeof storyItem === "object") {
                    if (storyItem && "VAR=" in storyItem && shared.externalSwitch) {
                        if (!labels[SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES]) {
                            labels[SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES] = [];
                        }
                        labels[SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES].push({
                            operations: getSetValue(
                                {
                                    defaultType: "storage",
                                    key: storyItem["VAR="],
                                    value: shared.externalSwitch,
                                },
                                [],
                                shared,
                            ),
                        });
                    }
                    addLabels(storyItem, labels, "", shared);
                }
            }
        }
    }

    function addLabels(
        storyItem: InkRootType | RootParserItemType,
        result: PixiVNJsonLabels,
        dadLabelKey: string = "",
        shared: MapperSharedType,
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
                const labelName =
                    (dadLabelKey ? dadLabelKey + CHOISE_LABEL_KEY_SEPARATOR : "") + key;
                // if (key.includes("g-")) {
                //     labelName = dadLabelKey.split(CHOISE_LABEL_KEY_SEPARATOR)[0] + CHOISE_LABEL_KEY_SEPARATOR + key
                // }
                parseLabel<PixiVNJsonLabelStep>(
                    value,
                    labelName,
                    shared,
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
}
