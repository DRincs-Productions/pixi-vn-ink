import type VariableReference from "@/interfaces/parserItems/VariableReference";
import type { PixiVNJsonConditionalStatements } from "@drincs/pixi-vn-json";
import type NativeFunctions from "./parserItems/NativeFunctions";
import type ReadCount from "./parserItems/ReadCount";

type LabelChoiceRes = {
    [label: string]: {
        text: string | (string | PixiVNJsonConditionalStatements<string>)[];
        preDialog?: { text: string; glue: boolean };
        onetime: boolean;
        conditions: (ReadCount | NativeFunctions | VariableReference)[];
    };
};
export default LabelChoiceRes;
