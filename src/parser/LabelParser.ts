import { PixiVNJsonArithmeticOperations, PixiVNJsonConditionalStatements, PixiVNJsonStepSwitchElementType } from '@drincs/pixi-vn';
import { CHOISE_LABEL_KEY_SEPARATOR } from '../constant';
import { arithmeticParser } from '../functions/ArithmeticUtility';
import InkRootType from '../types/InkRootType';
import { ContainerTypeN } from '../types/parserItems/ContainerType';
import { StandardDivert } from '../types/parserItems/Divert';
import RootParserItemType from '../types/parserItems/RootParserItemType';
import { MyVariableAssignment } from '../types/parserItems/VariableAssignment';
import { getConditionalValue } from './ConditionalStatementsParser';
import { parserSwitch } from './SwitchParser';

export type ShareDataParserLabel = {
    preDialog: { [label: string]: { text: string } },
    du?: any
}
export function parseLabel<T>(
    rootList: RootParserItemType[],
    labelKey: string,
    shareData: ShareDataParserLabel,
    itemList: T[] = [],
    addElement: (list: T[], item: T | string | StandardDivert | PixiVNJsonStepSwitchElementType<T> | MyVariableAssignment, labelKey: string, isNewLine: boolean) => void,
    addSwitchElemen: (list: PixiVNJsonStepSwitchElementType<T>[], item: T | string | StandardDivert | PixiVNJsonStepSwitchElementType<T> | MyVariableAssignment, labelKey: string, isNewLine?: boolean) => void,
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
            if (rootItem && typeof rootItem === "object") {
                if ("CNT?" in rootItem) {
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
                else if ("VAR=" in rootItem) {
                    let value = rootList[index - 1]
                    if (value && typeof value === "string" && value == "/str") {
                        value = rootList[index - 2]
                    }
                    if (value && typeof value === "object" && "^->" in value) {
                        value = (value as any)["^->"]
                    }
                    if (choiseList.length > 1) {
                        let arm = arithmeticParser(choiseList as any, labelKey)
                        if (arm && typeof arm === "object" && "type" in arm && arm.type == "value" && "storageType" in arm && arm.storageType == "logic") {
                            value = arm.operation as any
                        }
                    }
                    addElement(itemList, { typeOperation: "set", typeVar: "var", value: value as any, name: rootItem['VAR='] }, labelKey, isNewLine)
                }
                else if ("VAR?" in rootItem) {
                    choiseList.push(rootItem)
                }
            }
            else {
                if (typeof rootItem === "string" && rootItem == "/ev") {
                    if (isConditionalText) {
                        conditionalList.push(rootItem)
                    }
                    isInEnv = false
                    choiseList.push(rootItem)
                }
                else if (typeof rootItem === "string" && rootItem == "out") {
                    if (choiseList.length > 0) {
                        let lastValue = choiseList[choiseList.length - 1]
                        if (lastValue && typeof lastValue === "object" && "VAR?" in lastValue) {
                            choiseList.pop()
                            addElement(itemList, { typeOperation: "get", typeVar: "var", name: lastValue['VAR?'] }, labelKey, isNewLine)
                        }
                        else {
                            let varList = []
                            while (choiseList.length > 0 && choiseList[choiseList.length - 1] != "/ev") {
                                varList.push(choiseList.pop())
                            }
                            varList = varList.reverse()
                            let value = arithmeticParser(varList as any, labelKey)
                            if (value && typeof value === "object" && "type" in value && value.type == "value" && "storageType" in value && value.storageType == "logic") {
                                addElement(itemList, { typeOperation: "get", typeVar: "art", value: value.operation as PixiVNJsonArithmeticOperations }, labelKey, isNewLine)
                            }
                            else {
                                addElement(itemList, "<>", labelKey, isNewLine)
                                value = `^${value}`
                                addElement(itemList, value, labelKey, isNewLine)
                            }
                        }
                        isNewLine = false
                    }
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
            else if (rootItem.length > 2 && typeof rootItem[rootItem.length - 2] === "object" && rootItem[rootItem.length - 2] && "c" in (rootItem as any)[rootItem.length - 2]
                && typeof rootItem[rootItem.length - 1] === "object" && rootItem[rootItem.length - 1] && "b" in (rootItem as any)[rootItem.length - 1]
            ) {
                choiseList.pop()
                let list = []
                let item = []
                while (choiseList.length > 0 && choiseList[choiseList.length - 1] != "/ev") {
                    list.push(choiseList.pop() as any)
                }
                conditionalList = [...conditionalList, ...list.reverse()]
                isConditionalText = true
                item.push(rootItem.pop())
                item.push(rootItem.pop())
                conditionalList = [...conditionalList, ...rootItem]
                conditionalList.push(item as any)
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
            else if ("VAR=" in rootItem || "temp=" in rootItem) {
                let varList = []
                let type: "var" | "tempstorage" = "VAR=" in rootItem ? "var" : "tempstorage"
                let name = "VAR=" in rootItem ? rootItem['VAR='] : rootItem['temp=']
                choiseList.pop()
                if (choiseList[choiseList.length - 1] == "/ev") {
                    choiseList.pop()
                }
                while (choiseList.length > 0 && choiseList[choiseList.length - 1] != "/ev") {
                    varList.push(choiseList.pop())
                }
                varList = varList.reverse()
                let value = arithmeticParser(varList as any, labelKey)
                if (value !== undefined || value !== null) {
                    addElement(itemList, { typeOperation: "set", typeVar: type, value: value, name: name }, labelKey, isNewLine)
                }
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
            delete (secondItem as any).glueEnabled
            itemList[0] = secondItem
        }
    }
    return
}
