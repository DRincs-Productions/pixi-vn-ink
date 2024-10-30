import { PixiVNJson, PixiVNJsonLabelStep } from "@drincs/pixi-vn-json";
import TranslatorManager from "@drincs/pixi-vn-json/dist/managers/TranslateManager";

/**
 * This function set the function to translate the text
 * @param t The function to translate the text
 * @example
 * ```ts
 * import { onInkTranslate } from 'pixi-vn-ink'
 * import { useTranslation } from "react-i18next";
 * 
 * const { t } = useTranslation(["narration"]);
 * onInkTranslate((text) => {
 *    return t(text)
 * })
 * ```
 */
export function onInkTranslate(t: (text: string) => string) {
    TranslatorManager.translate = t
}

/**
 * Generate a json object with the keys of the labels and the values of the text to be translated
 * @param labels The labels to be used in the narrative. They will be added to the system
 * @param json If you want to add more keys to the existing json
 * @param options The options to set the default value if the key is not found
 * @returns The json object with the keys of the labels and the values of the text to be translated
 * @example
 * ```ts
 * import { generateTranslateJson, importInkText } from 'pixi-vn-ink'
 * 
 * let labels = importInkText( your_ink_text_here )
 * let json = generateTranslateJson(labels)
 * ```
 */
export function generateJsonInkTranslation(labels: PixiVNJsonLabelStep[] | PixiVNJson, json: object = {}, options: {
    /**
     * Default value to set if the key is not found
     * @default "empty_string"
     */
    defaultValue?: "empty_string" | "copy_key"
} = {}) {
    let tempLabels: PixiVNJsonLabelStep[] = []
    if (Array.isArray(labels)) {
        tempLabels = labels
    }
    else if (labels.labels) {
        Object.values(labels.labels).forEach((label) => {
            tempLabels = tempLabels.concat(label)
        })
    }
    return TranslatorManager.generateJsonTranslation(tempLabels, json, options)
}
