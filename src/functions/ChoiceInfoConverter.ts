import RootParserItemType from '../types/parserItems/RootParserItemType';

export function getLabelChoice(items: any[], result: { [label: string]: { text: string } }) {
    let text: string = ""
    let label: string = ""
    items.forEach((v, index) => {
        if (typeof v === "string") {
            // Dialog
            if (v.startsWith("^")) {
                text = v.substring(1)
            }
        }
        else if (v && typeof v === "object") {
            // if is a choice
            if ("*" in v && typeof v["*"] && typeof v["*"] === "string" && v["*"].includes("c")) {
                let l = "c" + v["*"].split("c")[1]
                label = l
            }
            // if is choise info
            else if ("s" in v && v["s"] instanceof Array) {
                let t = findChoiceText(v["s"])
                if (t) {
                    text = t
                }
            }
        }
        if (text && label) {
            if (result[label]) {
                result[label].text = text + result[label].text
            }
            else {
                result[label] = { text: text }
            }
            // split text and label
            let newListItem = items.slice(index + 1)
            getLabelChoice(newListItem, result)
            return
        }
    })
}

function findChoiceText(items: RootParserItemType[]): string | undefined {
    for (const item of items) {
        if (typeof item === "string") {
            if (item.startsWith("^")) {
                return item.substring(1)
            }
        }
        else if (item instanceof Array) {
            let res = findChoiceText(item)
            if (res) {
                return res
            }
        }
    }
}
