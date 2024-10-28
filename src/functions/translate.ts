import TranslatorManager from "@drincs/pixi-vn-json/dist/managers/TranslateManager";

export function onInkTranslate(t: (text: string) => string) {
    TranslatorManager.translate = t
}
