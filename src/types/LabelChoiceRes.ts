import { VariableChoiseText } from "../functions/VariableTextUtility"
import NativeFunctions from "./parserItems/NativeFunctions"
import ReadCount from "./parserItems/ReadCount"

type LabelChoiceRes = {
    [label: string]: {
        text: string | (string | VariableChoiseText)[]
        preDialog?: { text: string }
        onetime: boolean
        conditions: (ReadCount | NativeFunctions)[]
    }
}
export default LabelChoiceRes
