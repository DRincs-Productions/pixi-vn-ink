import ChoicePoint, { ChoiceInfo } from "./ChoicePoint"
import ControlCommands from "./ControlCommands"
import Divert from "./Divert"
import NativeFunctions from "./NativeFunctions"
import TextType from "./TextType"
import VariableAssignment from "./VariableAssignment"
import VariableReference from "./VariableReference"

type RootParserItemType = null | RootParserItemType[] | ChoiceInfo | ChoicePoint | ControlCommands | Divert | NativeFunctions | TextType | VariableAssignment | VariableReference
export default RootParserItemType
