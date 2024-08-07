import RootParserItemType from '../types/parserItems/RootParserItemType';

export function getLabelC(items: any[]): { text: string, label: string } | undefined {
    let text: string = ""
    let label: string = ""
    items.forEach((v) => {
        if (typeof v === "object") {
            // if is a choice
            if ("*" in v && typeof v["*"] === "string" && v["*"].includes("c")) {
                let l = "c" + v["*"].split("c")[1]
                label = l
            }
            // if is choise info
            else if ("s" in v && v["s"] instanceof Array) {
                let t = findChoiceTest(v["s"])
                if (t) {
                    text = t
                }
            }
        }
    })
    if (text && label) {
        return {
            text,
            label
        }
    }
    return undefined
}

function findChoiceTest(items: RootParserItemType[]): string | undefined {
    for (const item of items) {
        if (typeof item === "string") {
            if (item.startsWith("^")) {
                return item.substring(1)
            }
        }
        else if (item instanceof Array) {
            let res = findChoiceTest(item)
            if (res) {
                return res
            }
        }
    }
}
