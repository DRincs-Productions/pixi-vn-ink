// https://github.com/inkle/ink/blob/master/Documentation/ink_JSON_runtime_format.md#containers

import type { StandardDivert } from "@/interfaces/parserItems/Divert";
import type TextType from "@/interfaces/parserItems/TextType";

type ListItem = StandardDivert | "pop" | TextType | null;
export type ContainerTypeF = {
    "#f": number;
    [key: string]: ListItem[] | number;
};
export type ContainerTypeN = {
    "#n": string;
    // [key: string]: RootParserItemType[] | string,
};
