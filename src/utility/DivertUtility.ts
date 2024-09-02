import { CHOISE_LABEL_KEY_SEPARATOR } from "../constant"

export function getLabelByStandardDivert(divertName: string, labelKey: string): string {
    // start.0.g-1
    if (
        !(new RegExp(/^\.\^.*$/)).test(divertName)
        && divertName.includes("g-")
    ) {
        return getLabelByStandardDivertInternal(labelKey) + CHOISE_LABEL_KEY_SEPARATOR + "g-" + divertName.split("g-")[1]
    }

    let counter = 0

    if ((new RegExp(/.*\.[0-9]\..*/)).test(divertName)) {
        // remove .number. with regex
        let items = divertName.split(".").filter((item) => {
            return !item.match(/^[0-9]+$/)
        })
        divertName = items.join(".")
    }

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
        return getLabelByStandardDivertInternal(labelKey, counter) + CHOISE_LABEL_KEY_SEPARATOR + endOfLabel.replace(".", CHOISE_LABEL_KEY_SEPARATOR)
    }
    return divertName.replace(".", CHOISE_LABEL_KEY_SEPARATOR) || getLabelByStandardDivertInternal(labelKey, counter).replace(".", CHOISE_LABEL_KEY_SEPARATOR)
}

function getLabelByStandardDivertInternal(labelKey: string, counter: number = 0): string {
    let array = labelKey.split(CHOISE_LABEL_KEY_SEPARATOR)
    while (array.length > 1 && counter > 0) {
        array.pop()
        counter--
    }
    return array.join(CHOISE_LABEL_KEY_SEPARATOR)
}
