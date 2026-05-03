import type { PixiVNJsonStepSwitch } from "@drincs/pixi-vn-json/schema";

export type MapperSharedType = {
    labelToRemove: string[];
    initialVarsToRemove: string[];
    functions: { name: string; args: number }[];
    enums: { [key: string]: object };
    externalSwitch?: PixiVNJsonStepSwitch<string>;
    preDialog: { [label: string]: { text: string; glue: boolean } };
};
