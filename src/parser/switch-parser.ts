import { addChoiseIntoList } from "@/functions/choice-info-converter";
import type InkRootType from "@/interfaces/InkRootType";
import type { ContainerTypeF } from "@/interfaces/parserItems/ContainerType";
import type ControlCommands from "@/interfaces/parserItems/ControlCommands";
import type { DivertTunnel, StandardDivert } from "@/interfaces/parserItems/Divert";
import type NativeFunctions from "@/interfaces/parserItems/NativeFunctions";
import type RootParserItemType from "@/interfaces/parserItems/RootParserItemType";
import type TextType from "@/interfaces/parserItems/TextType";
import type { MyVariableAssignment } from "@/interfaces/parserItems/VariableAssignment";
import { parseLabel, type ShareDataParserLabel } from "@/parser/label-parser";
import type {
    PixiVNJsonStepSwitch,
    PixiVNJsonStepSwitchElementsType,
    PixiVNJsonStepSwitchElementType,
} from "@drincs/pixi-vn-json";

export type ConditionalList = (
    | number
    | ControlCommands
    | StandardDivert
    | DivertTunnel
    | NativeFunctions
    | TextType
    | ContainerTypeF
)[];

export function parserSwitch<T>(
    items: ConditionalList,
    addElement: (
        list: PixiVNJsonStepSwitchElementType<T>[],
        item:
            | T
            | string
            | StandardDivert
            | DivertTunnel
            | PixiVNJsonStepSwitchElementType<T>
            | MyVariableAssignment,
        labelKey: string,
        paramNames: string[],
    ) => void,
    addLabels: (
        storyItem: InkRootType | RootParserItemType,
        dadLabelKey: string,
        shareData: ShareDataParserLabel,
    ) => void,
    labelKey: string = "",
    shareData: ShareDataParserLabel,
    paramNames: string[],
    nestedId: string | undefined = undefined,
): PixiVNJsonStepSwitch<T> {
    const elements: PixiVNJsonStepSwitchElementsType<T> = [];
    let type: "random" | "sequential" | "loop" | "sequentialrandom" = "sequential";
    let min: boolean = false;
    let haveFixedEnd: boolean = true;

    items.forEach((item) => {
        if (item === "%") {
            type = "loop";
        }
        if (item === "seq") {
            type = "random";
        }
        if (item === "MIN") {
            min = true;
        }
        if (typeof item === "number") {
        }
    });

    const lastItem: ContainerTypeF = items[items.length - 1] as ContainerTypeF;
    Object.keys(lastItem).forEach((key) => {
        let value = lastItem[key];
        if (Array.isArray(value) && value.length > 3) {
            // remove the first item and the last two
            value = value.slice(1, value.length - 2);
            const itemList: T[] = [];

            parseLabel<T>(
                value,
                labelKey,
                shareData,
                itemList,
                addElement,
                addElement,
                addLabels,
                addChoiseIntoList,
                nestedId,
                true,
                paramNames,
            );
            if (itemList.length === 1) {
                elements.push(itemList[0]);
            } else {
                elements.push({
                    type: "resulttocombine",
                    combine: "cross",
                    secondConditionalItem: itemList,
                });
            }
        } else if (Array.isArray(value) && value.length === 3) {
            haveFixedEnd = false;
        }
    });

    if (type === "sequential") {
        const res: PixiVNJsonStepSwitch<T> = {
            type: "stepswitch",
            elements: elements,
            choiceType: type,
            end: haveFixedEnd ? "lastItem" : undefined,
            nestedId: nestedId,
        };
        return res;
    }
    if (min && type === "random") {
        const res: PixiVNJsonStepSwitch<T> = {
            type: "stepswitch",
            elements: elements,
            choiceType: "sequentialrandom",
            end: haveFixedEnd ? "lastItem" : undefined,
            nestedId: nestedId,
        };
        return res;
    }
    const res: PixiVNJsonStepSwitch<T> = {
        type: "stepswitch",
        elements: elements,
        choiceType: type,
    };
    return res;
}
