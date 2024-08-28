import { PixiVNJsonConditionalResultToCombine, PixiVNJsonConditionalStatements } from '@drincs/pixi-vn';
import LabelChoiceRes from '../types/LabelChoiceRes';
import ChoicePoint, { ChoiceInfo } from '../types/parserItems/ChoicePoint';
import NativeFunctions, { nativeFunctions } from '../types/parserItems/NativeFunctions';
import ReadCount from '../types/parserItems/ReadCount';
import RootParserItemType from '../types/parserItems/RootParserItemType';
import TextType from '../types/parserItems/TextType';
import { unionStringOrArray } from './utility';
import { ConditionalList, getVariableText } from './VariableTextUtility';

export function getLabelChoice(items: (TextType | ReadCount | NativeFunctions | ChoicePoint | ChoiceInfo | ConditionalList)[], result: LabelChoiceRes, lastLabel?: string) {
    let text: (string | PixiVNJsonConditionalResultToCombine<string | PixiVNJsonConditionalStatements<string>>)[] = []
    let label: string = ""
    let preDialog: string = ""
    let onetime: boolean = false
    let condition: (ReadCount | NativeFunctions)[] = []
    for (let index = 0; index < items.length; index++) {
        let v = items[index]
        if (typeof v === "string") {
            // Dialog
            if (v.startsWith("^")) {
                text.push(v.substring(1))
            }
            else if (nativeFunctions.includes(v as NativeFunctions)) {
                condition.push(v as NativeFunctions)
            }
        }
        else if (Array.isArray(v) && v.includes("visit")) {
            let secondConditionalItem = getVariableText(v, lastLabel)
            let item: PixiVNJsonConditionalResultToCombine<string | PixiVNJsonConditionalStatements<string>> = {
                type: "crwde",
                secondConditionalItem: secondConditionalItem
            }
            text.push(item)
        }
        else if (v && typeof v === "object") {
            // if is a choice
            if ("*" in v && typeof v["*"] && typeof v["*"] === "string" && v["*"].includes("c")) {
                let l = "c" + v["*"].split("c")[1]
                label = l
                if (v.flg & 0x10) {
                    onetime = true
                }
            }
            // if is choise info
            else if ("s" in v && v["s"] instanceof Array) {
                let t = findChoiceText(v["s"])
                if (t) {
                    if (lastLabel && result[lastLabel]) {
                        result[lastLabel].preDialog = { text: t }
                        result[lastLabel].text = unionStringOrArray(t, result[lastLabel].text)
                    }
                    else {
                        text.push(t)
                        preDialog = t
                    }
                }
            }
            else if ("CNT?" in v) {
                condition.push(v)
            }
        }
        else {
            condition.push(v)
        }
        if (text.length > 0 && label) {
            if (result[label]) {
                result[label].text = unionStringOrArray(text, result[label].text)
            }
            else {
                result[label] = { text: text, onetime: onetime, conditions: condition }
            }
            if (preDialog) {
                result[label].preDialog = { text: preDialog }
            }
            // split text and label
            let newListItem = items.slice(index + 1)
            getLabelChoice(newListItem, result, label)
            return
        }
    }
}

function findChoiceText(items: RootParserItemType[]): string | undefined {
    for (const item of items) {
        if (typeof item === "string") {
            if (item.startsWith("^")) {
                return item.substring(1)
            }
        }
        else if (item instanceof Array) {
            let res = findChoiceText(item)
            if (res) {
                return res
            }
        }
    }
}
