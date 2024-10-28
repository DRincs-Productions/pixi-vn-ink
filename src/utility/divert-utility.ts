import { CHOISE_LABEL_KEY_SEPARATOR } from "../constant"

export function getLabelByStandardDivert(divertName: string, labelKey: string): string {
    // start.0.g-1
    if (
        (new RegExp(/.*\.[0-9]+\..*$/)).test(divertName)
    ) {
        // remove .number. with regex
        let items = divertName.split(".").filter((item) => {
            return !item.match(/^[0-9]+$/)
        })
        divertName = items.join(".")
        if (!divertName.startsWith(".")) {
            return divertName.replaceAll(".", CHOISE_LABEL_KEY_SEPARATOR)
        }
    }

    // start_|_g-0
    if (
        !(new RegExp(/^\.\^.*$/)).test(divertName)
        && divertName.includes("g-")
    ) {
        let list = divertName.split("g-")
        return getLabelByStandardDivertInternal(labelKey) + CHOISE_LABEL_KEY_SEPARATOR + "g-" + list[list.length - 1]
    }

    let counter = 0

    while ((new RegExp(/^\.\^.*$/)).test(divertName)) {
        counter++
        divertName = divertName.substring(2)
    }
    counter = counter - 1

    if (
        // if there are a sub label "=label"
        (new RegExp(/^\..*$/)).test(divertName)
        && labelKey
    ) {
        let endOfLabel = divertName.substring(1)
        return getLabelByStandardDivertInternal(labelKey, counter) + CHOISE_LABEL_KEY_SEPARATOR + endOfLabel.replaceAll(".", CHOISE_LABEL_KEY_SEPARATOR)
    }
    return divertName.replaceAll(".", CHOISE_LABEL_KEY_SEPARATOR) || getLabelByStandardDivertInternal(labelKey, counter).replaceAll(".", CHOISE_LABEL_KEY_SEPARATOR)
}

function getLabelByStandardDivertInternal(labelKey: string, counter: number = 0): string {
    let array = labelKey.split(CHOISE_LABEL_KEY_SEPARATOR)
    while (array.length > 1 && counter > 0) {
        let i = array.pop()
        if (i?.includes("g-")) {
            counter--
        }
        counter--
    }
    return array.join(CHOISE_LABEL_KEY_SEPARATOR)
}
