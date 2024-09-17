import { PixiVNJsonArithmeticOperations, PixiVNJsonConditionalStatements, PixiVNJsonStepSwitchElementType } from '@drincs/pixi-vn';
import { CHOISE_LABEL_KEY_SEPARATOR } from '../constant';
import { arithmeticParser } from '../functions/ArithmeticUtility';
import InkRootType from '../types/InkRootType';
import { ContainerTypeN } from '../types/parserItems/ContainerType';
import { StandardDivert } from '../types/parserItems/Divert';
import RootParserItemType from '../types/parserItems/RootParserItemType';
import { MyVariableAssignment } from '../types/parserItems/VariableAssignment';
import { getParam } from '../utility/ValueUtility';
import { getConditionalValue } from './ConditionalStatementsParser';
import { parserSwitch } from './SwitchParser';

export type ShareDataParserLabel = {
    preDialog: { [label: string]: { text: string } },
    du?: any
    params?: {}
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
        paramNames: string[],
    ) => void,
    nestedId: string | undefined = undefined,
    isNewLine: boolean = true,
    paramNames: string[] = [],
) {
    let isInEnv = false
    let envList: RootParserItemType[] = []
    let isConditionalText = false
    let conditionalList: RootParserItemType[] = []
    if (shareData.preDialog[labelKey]) {
        // *	Hello [back!] right back to you!
        isNewLine = false
        addElement(itemList, "^" + shareData.preDialog[labelKey].text, labelKey, isNewLine)
        delete shareData.preDialog[labelKey]
    }
    if (rootList.includes("visit")) {
        let item = parserSwitch<T>(rootList as any, addSwitchElemen, addLabels, labelKey, shareData, paramNames, nestedId)
        if (item) {
            if (!isNewLine && itemList.length > 0) {
                addElement(itemList, "<>", labelKey, isNewLine)
            }
            addElement(itemList, item, labelKey, isNewLine)
        }
        return
    }
    let firstItem = rootList[0]
    if (firstItem && typeof firstItem === "object" && "temp=" in firstItem) {
        while (rootList[0] && typeof rootList[0] === "object" && "temp=" in (rootList[0] as any)) {
            paramNames.push((rootList[0] as any)["temp="])
            rootList.shift()
        }
    }
    rootList.forEach((rootItem, index) => {
        if (isInEnv) {
            if (Array.isArray(rootItem)) {
                envList.push(rootItem)
            }
            else if (rootItem && typeof rootItem === "object") {
                if ("CNT?" in rootItem) {
                    if (index > 0 && rootList[index - 1] == "ev") {
                        isConditionalText = true
                        conditionalList.push(rootItem)
                    }
                    else if (isConditionalText) {
                        conditionalList.push(rootItem)
                    }
                    else {
                        envList.push(rootItem)
                    }
                    isNewLine = false
                }
                else if ("VAR=" in rootItem || "temp=" in rootItem) {
                    let type: "storage" | "tempstorage" | "params" = "VAR=" in rootItem ? "storage" : "tempstorage"
                    let name = "VAR=" in rootItem ? rootItem['VAR='] : rootItem['temp=']
                    let paramIndex = paramNames.indexOf(name)
                    if (paramIndex >= 0) {
                        type = "params"
                        name = paramIndex
                    }
                    let value = rootList[index - 1]
                    if (value && typeof value === "string" && value == "/str") {
                        value = rootList[index - 2]
                    }
                    if (value && typeof value === "object" && "^->" in value) {
                        value = (value as any)["^->"]
                    }
                    if (envList.length > 1) {
                        let arm = arithmeticParser(envList as any, labelKey, paramNames)
                        envList = []
                        if (arm && typeof arm === "object" && "type" in arm && arm.type == "value" && "storageType" in arm && arm.storageType == "logic") {
                            value = arm.operation as any
                        }
                    }
                    if (typeof name !== "string" || !name.includes("$r")) {
                        addElement(itemList, { typeOperation: "set", typeVar: type, value: value as any, name: name }, labelKey, isNewLine)
                    }
                }
                else if ("VAR?" in rootItem) {
                    envList.push(rootItem)
                }
                else if ("^->" in rootItem) {
                    let i: string = rootItem["^->"] as any
                    if (!i.includes("$r")) {
                        envList.push(rootItem)
                    }
                }
            }
            else {
                if (typeof rootItem === "string" && rootItem == "/ev") {
                    if (isConditionalText) {
                        conditionalList.push(rootItem)
                    }
                    isInEnv = false
                    envList.push(rootItem)
                }
                else if (typeof rootItem === "string" && rootItem == "out") {
                    if (envList.length > 0) {
                        let lastValue = envList[envList.length - 1]
                        if (lastValue && typeof lastValue === "object" && "VAR?" in lastValue) {
                            envList.pop()
                            let type: "storage" | "params" = "storage"
                            let name: any = lastValue['VAR?']
                            let paramIndex = paramNames.indexOf(name)
                            if (paramIndex >= 0) {
                                type = "params"
                                name = paramIndex
                            }
                            addElement(itemList, { typeOperation: "get", typeVar: type, name: name }, labelKey, isNewLine)
                        }
                        else {
                            let varList = []
                            while (envList.length > 0 && envList[envList.length - 1] != "/ev") {
                                varList.push(envList.pop())
                            }
                            varList = varList.reverse()
                            let value = arithmeticParser(varList as any, labelKey, paramNames)
                            envList = []
                            if (value && typeof value === "object" && "type" in value && value.type == "value" && "storageType" in value && value.storageType == "logic") {
                                addElement(itemList, { typeOperation: "get", typeVar: "logic", value: value.operation as PixiVNJsonArithmeticOperations }, labelKey, isNewLine)
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
                    envList.push(rootItem)
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
                let res = getConditionalValue<T>(conditionalList as any[], addSwitchElemen, addLabels, labelKey, shareData, paramNames, nestedId)
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
            else if (rootItem.length > 1 && typeof rootItem[rootItem.length - 2] === "object" && rootItem[rootItem.length - 2] && "c" in (rootItem as any)[rootItem.length - 2]
                && typeof rootItem[rootItem.length - 1] === "object" && rootItem[rootItem.length - 1] && "b" in (rootItem as any)[rootItem.length - 1]
            ) {
                envList.pop()
                let list = []
                let item = []
                while (envList.length > 0 && envList[envList.length - 1] != "/ev") {
                    list.push(envList.pop() as any)
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
                let params = []
                if (envList.length > 0) {
                    params = getParam(["ev", ...envList], labelKey, paramNames)
                }
                rootItem["params"] = params
                addElement(itemList, rootItem, labelKey, isNewLine)
                isNewLine = false
            }
            else if ("*" in rootItem && typeof rootItem["*"] === "string") {
                if (rootItem["*"].includes("c")) {
                    envList.push(rootItem)
                    isNewLine = false
                }
            }
            // if is choise info
            else if ("s" in rootItem && rootItem["s"] instanceof Array) {
                envList.push(rootItem)
                isNewLine = false
            }
            else if ("CNT?" in rootItem) {
                envList.push(rootItem)
                isNewLine = false
            }
            else if ("VAR=" in rootItem || "temp=" in rootItem) {
                let varList = []
                let type: "storage" | "tempstorage" | "params" = "VAR=" in rootItem ? "storage" : "tempstorage"
                let name = "VAR=" in rootItem ? rootItem['VAR='] : rootItem['temp=']
                let paramIndex = paramNames.indexOf(name)
                if (paramIndex >= 0) {
                    type = "params"
                    name = paramIndex
                }
                if (name !== "$r") {
                    envList.pop()
                    if (envList[envList.length - 1] == "/ev") {
                        envList.pop()
                    }
                    while (envList.length > 0 && envList[envList.length - 1] != "/ev") {
                        varList.push(envList.pop())
                    }
                    varList = varList.reverse()
                    let value = arithmeticParser(varList as any, labelKey, paramNames)
                    envList = []
                    if (value !== undefined || value !== null) {
                        addElement(itemList, { typeOperation: "set", typeVar: type, value: value, name: name }, labelKey, isNewLine)
                    }
                    isNewLine = false
                }
            }
            else {
                addLabels(rootItem, labelKey, shareData)
            }
        }
    })
    addChoiseList(envList, itemList, labelKey, shareData, paramNames)
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
