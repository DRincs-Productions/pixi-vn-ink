import InkRootType from "../InkRootType"
import { ChoiceInfo, ChoiceLabel } from "./ChoiceType"

type RootParserItemType = string | null | RootParserItemType[] | InkRootType | ChoiceLabel | ChoiceInfo
export default RootParserItemType
