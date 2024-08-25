import { PixiVNJsonLabelStep, PixiVNJsonStepSwitch } from "@drincs/pixi-vn"
import ControlCommands from "../types/parserItems/ControlCommands"
import { StandardDivert } from "../types/parserItems/Divert"
import NativeFunctions from "../types/parserItems/NativeFunctions"
import TextType from "../types/parserItems/TextType"
import { getLabelByStandardDivert } from "./DivertUtility"

type ListItem = StandardDivert | "pop" | TextType | null
type Item = {
    "#f": number,
    [key: string]: ListItem[] | number,
}

export function getVariableStep(items: (number | ControlCommands | StandardDivert | NativeFunctions | TextType | Item)[], labelKey: string, nestedId: string | undefined = undefined): PixiVNJsonStepSwitch<PixiVNJsonLabelStep> {
    let elements: PixiVNJsonLabelStep[] = []
    let type: "random" | "sequential" | "loop" = "sequential"
    let haveFixedEnd: boolean = true
    let currentIndex: number | undefined = undefined

    items.forEach((item) => {
        if (item === "%") {
            type = "loop"
        }
        if (item === "du") {
            haveFixedEnd = false
        }
        if (item === "seq") {
            type = "random"
        }
        if (item === "env") {
            currentIndex = undefined
            haveFixedEnd = true
        }
        if (typeof item === "number") {
            currentIndex = item
        }
    })

    let lastItem: Item = items[items.length - 1] as Item
    Object.keys(lastItem).forEach((key) => {
        let value = lastItem[key]
        if (Array.isArray(value) && value.length > 3) {
            // remove the first item and the last two
            value = value.slice(1, value.length - 2)
            value.forEach((v) => {
                let item: PixiVNJsonLabelStep = {}
                if (typeof v === "string" && v.startsWith("^")) {
                    item.dialogue = v.substring(1)
                }
                else if (Array.isArray(v)) {
                    if (v.includes("visit")) {
                        item.conditionalStep = getVariableStep(v, labelKey, nestedId)
                    }
                    else {
                        console.error("[Pixi’VN Ink] Unhandled case: value is an array", v)
                    }
                }
                else if (v && typeof v === "object" && "->" in v && typeof v["->"] === "string") {
                    let label = getLabelByStandardDivert(v["->"], labelKey)
                    item.labelToOpen = {
                        label: label,
                        type: "call",
                    }
                }
                else if (typeof v === "string" && v === "end") {
                    item.end = "game_end"
                }
                else if (typeof v === "string" && v === "done") {
                    item.end = "label_end"
                }
                elements.push(item)
            })
        }
        else {
            console.error("[Pixi’VN Ink] Unhandled case: value is not an array", value)
        }
    })

    if (type === "sequential") {
        let res: PixiVNJsonStepSwitch<PixiVNJsonLabelStep> = {
            type: "stepswitch",
            elements: elements,
            choiceType: type,
            end: haveFixedEnd ? "lastItem" : undefined,
            nestedId: nestedId,
        }
        return res
    }
    let res: PixiVNJsonStepSwitch<PixiVNJsonLabelStep> = {
        type: "stepswitch",
        elements: elements,
        choiceType: type,
    }
    return res
}
