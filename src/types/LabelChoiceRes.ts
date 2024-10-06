import { PixiVNJsonConditionalStatements } from "@drincs/pixi-vn-json"
import NativeFunctions from "./parserItems/NativeFunctions"
import ReadCount from "./parserItems/ReadCount"

type LabelChoiceRes = {
    [label: string]: {
        text: string | (string | PixiVNJsonConditionalStatements<string>)[]
        preDialog?: { text: string, glue: boolean }
        onetime: boolean
        conditions: (ReadCount | NativeFunctions)[]
    }
}
export default LabelChoiceRes
