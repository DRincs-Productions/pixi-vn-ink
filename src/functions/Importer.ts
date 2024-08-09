import { importPixiVNJson } from "@drincs/pixi-vn";
import { convertInkText } from "./InkToPixivn";

export function importInkText(text: string | string[]) {
    // if is array
    if (Array.isArray(text)) {
        text.forEach((t) => {
            importInkText(t)
        })
        return
    }
    let data = convertInkText(text)
    if (data) {
        {
            importPixiVNJson(data)
        }
    }
}
