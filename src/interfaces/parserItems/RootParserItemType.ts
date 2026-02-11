import ChoicePoint, { ChoiceInfo } from "./ChoicePoint"
import { ContainerTypeN } from "./ContainerType"
import ControlCommands from "./ControlCommands"
import Divert from "./Divert"
import NativeFunctions from "./NativeFunctions"
import ReadCount from "./ReadCount"
import TextType from "./TextType"
import VariableAssignment from "./VariableAssignment"
import VariableReference from "./VariableReference"

type RootParserItemType = null | RootParserItemType[] | ChoiceInfo | ChoicePoint | ControlCommands | Divert | NativeFunctions | TextType
    | VariableAssignment | VariableReference | ReadCount | ContainerTypeN
export default RootParserItemType
