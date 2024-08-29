import { PixiVNJsonConditionalStatements, PixiVNJsonLabelStep, PixiVNJsonStepSwitchElementType } from "@drincs/pixi-vn";
import { StandardDivert } from "../types/parserItems/Divert";
import { getLabelByStandardDivert } from "./DivertUtility";

export function addConditionalElementText(list: (string | PixiVNJsonConditionalStatements<string>)[], item: string | StandardDivert | PixiVNJsonConditionalStatements<string>) {
    if (!item) {
        return
    }
    if (typeof item === "string") {
        if (item.startsWith("^")) {
            list.push(item.substring(1))
        }
    }
    else if (typeof item === "object" && "type" in item) {
        list.push(item)
    }
}

export function addSwitchElemenText(list: PixiVNJsonStepSwitchElementType<string>[], item: string | StandardDivert | PixiVNJsonStepSwitchElementType<string>) {
    if (!item) {
        return
    }
    if (typeof item === "string") {
        if (item.startsWith("^")) {
            list.push(item.substring(1))
        }
    }
    else if (typeof item === "object" && "type" in item) {
        list.push(item)
    }
}

export function addConditionalElementStep(
    list: (PixiVNJsonLabelStep | PixiVNJsonConditionalStatements<PixiVNJsonLabelStep>)[],
    item: string | PixiVNJsonLabelStep | StandardDivert | PixiVNJsonConditionalStatements<PixiVNJsonLabelStep>,
    labelKey: string
) {
    if (!item) {
        return
    }
    if (typeof item === "string") {
        if (item.startsWith("^")) {
            list.push({ dialogue: item.substring(1) })
        }
        else if (item === "end") {
            list.push({ end: "game_end" })
        }
        else if (item === "done") {
            list.push({ end: "label_end" })
        }
    }
    else if (typeof item === "object" && "type" in item) {
        list.push(item)
    }
    else if (typeof item === "object" && "->" in item) {
        let label = getLabelByStandardDivert((item as any)["->"], labelKey)
        list.push({
            labelToOpen: {
                label: label,
                type: "call",
            }
        })
    }
}

export function addSwitchElemenStep(
    list: PixiVNJsonStepSwitchElementType<PixiVNJsonLabelStep>[],
    item: string | PixiVNJsonLabelStep | StandardDivert | PixiVNJsonStepSwitchElementType<PixiVNJsonLabelStep>,
    labelKey: string
) {
    if (!item) {
        return
    }
    if (typeof item === "string") {
        if (item.startsWith("^")) {
            list.push({ dialogue: item.substring(1) })
        }
        else if (item === "end") {
            list.push({ end: "game_end" })
        }
        else if (item === "done") {
            list.push({ end: "label_end" })
        }
    }
    else if (typeof item === "object" && "type" in item) {
        list.push(item)
    }
    else if (typeof item === "object" && "->" in item) {
        let label = getLabelByStandardDivert(item["->"], labelKey)
        list.push({
            labelToOpen: {
                label: label,
                type: "call",
            },
            // TODO glueEnabled: glueEnabled,
        })
    }
}
