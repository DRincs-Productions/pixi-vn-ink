import { GLOBAL_DECL, SPECIAL_LABEL_FOR_EXTERNAL_VARIABLES } from "@/constant";
import { getInkLabels } from "@/functions/labels-converter";
import type InkStoryType from "@/interfaces/InkStoryType";
import type { CompileSharedType } from "@/parser/types";
import type { PixiVNJson } from "@drincs/pixi-vn-json";

export namespace InkMapper {
    export function inkToJson(
        obj: InkStoryType,
        shared: Partial<CompileSharedType> = {},
    ): PixiVNJson | undefined {
        const { labelToRemove = [], initialVarsToRemove = [] } = shared;
        const result: PixiVNJson = {};
        result.labels = getInkLabels(obj.root, shared);
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
}
