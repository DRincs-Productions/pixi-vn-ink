import * as characterUtils from "@drincs/pixi-vn/characters";
import * as historyUtils from "@drincs/pixi-vn/history";
import * as narrationUtils from "@drincs/pixi-vn/narration";
import * as storageUtils from "@drincs/pixi-vn/storage";
import { GameUnifier } from "@drincs/pixi-vn/unifier";
import { Plugin } from "vite";
import { importInkText } from "../functions/importer";

/**
 * This function creates a Vite plugin that prevents Hot Module Replacement (HMR) for .ink files.
 * Instead of triggering HMR, it imports the .ink file using the `importInkText` function.
 * @returns A Vite plugin that prevents HMR for .ink files.
 */
export function noHmrInkPlugin(): Plugin {
    return {
        name: "no-hmr-ink",
        async handleHotUpdate({ file, read }) {
            if (file.endsWith(".ink")) {
                const fileText = await read();
                GameUnifier.init({
                    getCurrentGameStepState: () => {
                        return {
                            storage: storageUtils.storage.export(),
                            labelIndex: narrationUtils.NarrationManagerStatic.currentLabelStepIndex || 0,
                            openedLabels: narrationUtils.narration.openedLabels,
                        };
                    },
                    restoreGameStepState: async (state, navigate) => {
                        historyUtils.HistoryManagerStatic._originalStepData = state;
                        narrationUtils.NarrationManagerStatic.openedLabels = state.openedLabels;
                        storageUtils.storage.restore(state.storage);
                        navigate(state.path);
                    },
                    // narration
                    getStepCounter: () => narrationUtils.narration.stepCounter,
                    setStepCounter: (value) => {
                        narrationUtils.NarrationManagerStatic._stepCounter = value;
                    },
                    getOpenedLabels: () => narrationUtils.narration.openedLabels.length,
                    addHistoryItem: (historyInfo, options) => {
                        return historyUtils.stepHistory.add(historyInfo, options);
                    },
                    getCurrentStepsRunningNumber: () => narrationUtils.NarrationManagerStatic.stepsRunning,
                    getCharacter: (id: string) => {
                        return characterUtils.RegisteredCharacters.get(id);
                    },
                    // canvas
                    onGoNextEnd: async () => {},
                    // storage
                    getVariable: (key) => storageUtils.storage.getVariable(key),
                    setVariable: (key, value) => storageUtils.storage.setVariable(key, value),
                    removeVariable: (key) => storageUtils.storage.removeVariable(key),
                    getFlag: (key) => storageUtils.storage.getFlag(key),
                    setFlag: (name, value) => storageUtils.storage.setFlag(name, value),
                    onLabelClosing: (openedLabelsNumber) =>
                        storageUtils.StorageManagerStatic.clearOldTempVariables(openedLabelsNumber),
                });
                await importInkText(fileText);
                // Don't trigger HMR for .ink files, but still allow manual refresh to pick up changes
                return [];
            }
        },
    };
}
