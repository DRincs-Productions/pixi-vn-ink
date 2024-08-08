import { importPixiVNJson } from "@drincs/pixi-vn";
import { convertInkText } from "./InkToPixivn";

export function importInkText(text: string) {
    let data = convertInkText(text)
    if (data) {
        {
            importPixiVNJson(data)
        }
    }
}
