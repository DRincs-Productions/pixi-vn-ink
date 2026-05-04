import type NativeFunctions from "@/interfaces/parserItems/NativeFunctions";
import type ReadCount from "@/interfaces/parserItems/ReadCount";
import type { PixiVNJsonStepSwitch } from "@drincs/pixi-vn-json/schema";

export type MapperSharedType = {
    labelToRemove: string[];
    initialVarsToRemove: string[];
    functions: { name: string; args: number }[];
    enums: { [key: string]: any };
    externalSwitch?: PixiVNJsonStepSwitch<string>;
    preDialog: { [label: string]: { text: string; glue: boolean } };
    du?: NativeFunctions | ReadCount;
    params?: object;
};
