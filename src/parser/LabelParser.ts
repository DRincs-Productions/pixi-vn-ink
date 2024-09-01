import { PixiVNJsonConditionalStatements, PixiVNJsonStepSwitchElementType } from '@drincs/pixi-vn';
import { CHOISE_LABEL_KEY_SEPARATOR } from '../constant';
import InkRootType from '../types/InkRootType';
import { ContainerTypeN } from '../types/parserItems/ContainerType';
import { StandardDivert } from '../types/parserItems/Divert';
import RootParserItemType from '../types/parserItems/RootParserItemType';
import { getConditionalValue } from './ConditionalStatementsParser';
import { parserSwitch } from './SwitchParser';

export type ShareDataParserLabel = {
    preDialog: { [label: string]: { text: string } }
}
export function parseLabel<T>(
    rootList: RootParserItemType[],
    labelKey: string,
    shareData: ShareDataParserLabel,
    itemList: T[] = [],
    addElement: (list: T[], item: T | string | StandardDivert | PixiVNJsonStepSwitchElementType<T>, labelKey: string, isNewLine: boolean) => void,
    addSwitchElemen: (list: PixiVNJsonStepSwitchElementType<T>[], item: T | string | StandardDivert | PixiVNJsonStepSwitchElementType<T>, labelKey: string, isNewLine?: boolean) => void,
    addLabels: (storyItem: InkRootType | RootParserItemType, dadLabelKey: string, shareData: ShareDataParserLabel) => void,
    addChoiseList: (
        choiseList: RootParserItemType[],
        itemList: (T | PixiVNJsonConditionalStatements<T>)[],
        labelKey: string,
        shareData: ShareDataParserLabel,
    ) => void,
    nestedId: string | undefined = undefined,
    isNewLine: boolean = true,
) {
    let isInEnv = false
    let choiseList: RootParserItemType[] = []
    let isConditionalText = false
    let conditionalList: RootParserItemType[] = []
    if (shareData.preDialog[labelKey]) {
        // *	Hello [back!] right back to you!
        isNewLine = false
        addElement(itemList, "^" + shareData.preDialog[labelKey].text, labelKey, isNewLine)
        delete shareData.preDialog[labelKey]
    }
    if (rootList.includes("visit")) {
        let item = parserSwitch<T>(rootList as any, addSwitchElemen, addLabels, labelKey, shareData, nestedId)
        if (item) {
            if (!isNewLine && itemList.length > 0) {
                addElement(itemList, "<>", labelKey, isNewLine)
            }
            addElement(itemList, item, labelKey, isNewLine)
        }
        return
    }
    rootList.forEach((rootItem, index) => {
        if (isInEnv) {
            if (rootItem && typeof rootItem === "object" && "CNT?" in rootItem) {
                if (index > 0 && rootList[index - 1] == "ev") {
                    isConditionalText = true
                    conditionalList.push(rootItem)
                }
                else if (isConditionalText) {
                    conditionalList.push(rootItem)
                }
                else {
                    choiseList.push(rootItem)
                }
                isNewLine = false
            }
            else {
                if (typeof rootItem === "string" && rootItem == "/ev") {
                    if (isConditionalText) {
                        conditionalList.push(rootItem)
                    }
                    isInEnv = false
                    choiseList.push(rootItem)
                }
                else {
                    choiseList.push(rootItem)
                }
            }
        }
        else if (typeof rootItem === "string") {
            // Dialog
            if (rootItem.startsWith("^")) {
                addElement(itemList, rootItem, labelKey, isNewLine)
                isNewLine = false
            }
            else if (rootItem == "ev") {
                isInEnv = true
            }
            else if (rootItem == "\n") {
                isNewLine = true
            }
            else if (rootItem == "done" || rootItem == "end") {
                addElement(itemList, rootItem, labelKey, isNewLine)
                isNewLine = false
            }
            else if (rootItem == "<>") {
                addElement(itemList, rootItem, labelKey, isNewLine)
                isNewLine = false
            }
            else if (rootItem == 'nop' && isConditionalText) {
                let res = getConditionalValue<T>(conditionalList as any[], addSwitchElemen, addLabels, labelKey, shareData, nestedId)
                if (res) {
                    addElement(itemList, res, labelKey, isNewLine)
                }
                isConditionalText = false
                conditionalList = []
            }
        }
        else if (rootItem instanceof Array) {
            if (isConditionalText) {
                conditionalList.push(rootItem)
            }
            else if (rootItem.length > 1 && typeof rootItem[rootItem.length - 1] === "object" && rootItem[rootItem.length - 1] && "#n" in (rootItem as any[])[rootItem.length - 1]) {
                let el = rootItem.pop() as ContainerTypeN | undefined
                if (!el) {
                    console.error("[Pixi’VN Ink] Error parsing ink file: el is undefined")
                    return
                }
                let newLabelKey = el["#n"]
                delete (el as any)["#n"]
                rootItem.push(el)
                addElement(itemList, { "->": labelKey ? labelKey + CHOISE_LABEL_KEY_SEPARATOR + newLabelKey : newLabelKey }, labelKey, isNewLine);
                addLabels({
                    [newLabelKey]: rootItem
                }, labelKey, shareData)
            }
            else {
                parseLabel(rootItem, labelKey, shareData, itemList, addElement, addSwitchElemen, addLabels, addChoiseList, nestedId, isNewLine)
            }
        }
        else if (rootItem && typeof rootItem === "object") {
            if ("->" in rootItem && typeof rootItem["->"] === "string"
                // {->: '.^.^.2.s'}
                && !(new RegExp(/^\.\^\.\^\.\d\.s$/)).test(rootItem["->"])
            ) {
                addElement(itemList, rootItem, labelKey, isNewLine)
                isNewLine = false
            }
            else if ("*" in rootItem && typeof rootItem["*"] === "string") {
                if (rootItem["*"].includes("c")) {
                    choiseList.push(rootItem)
                    isNewLine = false
                }
            }
            // if is choise info
            else if ("s" in rootItem && rootItem["s"] instanceof Array) {
                choiseList.push(rootItem)
                isNewLine = false
            }
            else if ("CNT?" in rootItem) {
                choiseList.push(rootItem)
                isNewLine = false
            }
            else {
                addLabels(rootItem, labelKey, shareData)
            }
        }
    })
    addChoiseList(choiseList, itemList, labelKey, shareData)
    // * [Open the gate] -> paragraph_2
    if (labelKey.includes(CHOISE_LABEL_KEY_SEPARATOR) && itemList.length == 2) {
        let firstItem = itemList[0]
        let secondItem = itemList[1]
        if (firstItem && secondItem
            && typeof firstItem === "object" && "dialogue" in firstItem
            && typeof secondItem === "object" && "labelToOpen" in secondItem
            && firstItem.dialogue == " " && secondItem.labelToOpen
        ) {
            // remove first step
            itemList.shift();
            (secondItem as any).glueEnabled = undefined
            itemList[0] = secondItem
        }
    }
    return
}
