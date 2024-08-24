import { PixiVNJsonStepSwitch } from "@drincs/pixi-vn"
import ControlCommands from "../types/parserItems/ControlCommands"
import { StandardDivert } from "../types/parserItems/Divert"
import NativeFunctions from "../types/parserItems/NativeFunctions"
import TextType from "../types/parserItems/TextType"

type ListItem = StandardDivert | "pop" | TextType | null
type Item = {
    "#f": number,
    [key: string]: ListItem[] | number,
}

export function getVariableText(items: (number | ControlCommands | StandardDivert | NativeFunctions | TextType | Item)[]): PixiVNJsonStepSwitch<string> {
    let elements: string[] = []
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
        if (Array.isArray(value)) {
            value.forEach((v) => {
                if (typeof v === "string" && v.startsWith("^")) {
                    elements.push(v.substring(1))
                }
            })
        }
    })

    if (type === "sequential") {
        let res: PixiVNJsonStepSwitch<string> = {
            type: "stepswitch",
            elements: elements,
            choiceType: type,
            end: haveFixedEnd ? "lastItem" : undefined,
        }
        return res
    }
    let res: PixiVNJsonStepSwitch<string> = {
        type: "stepswitch",
        elements: elements,
        choiceType: type,
    }
    return res
}
