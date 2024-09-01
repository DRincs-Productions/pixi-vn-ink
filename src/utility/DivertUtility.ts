import { CHOISE_LABEL_KEY_SEPARATOR } from "../constant"

export function getLabelByStandardDivert(divertName: string, labelKey: string): string {
    // start.0.g-1
    if (
        !(new RegExp(/^\.\^.*$/)).test(divertName)
        && divertName.includes("g-")
    ) {
        return labelKey.split(CHOISE_LABEL_KEY_SEPARATOR)[0] + CHOISE_LABEL_KEY_SEPARATOR + "g-" + divertName.split("g-")[1]
    }

    while ((new RegExp(/^\.\^.*$/)).test(divertName)) {
        divertName = divertName.substring(2)
    }

    if (
        // if there are a sub label "=label"
        (new RegExp(/^\..*$/)).test(divertName)
        && labelKey
    ) {
        let endOfLabel = divertName.substring(1)
        let labelKeyArray = labelKey.split(CHOISE_LABEL_KEY_SEPARATOR)
        if (labelKey.includes("c-") || labelKey.includes("g-")) {
            labelKeyArray.pop()
        }
        labelKey = labelKeyArray.join(CHOISE_LABEL_KEY_SEPARATOR)
        return labelKey + CHOISE_LABEL_KEY_SEPARATOR + endOfLabel
    }
    return divertName.replace(".", CHOISE_LABEL_KEY_SEPARATOR) || labelKey.split(CHOISE_LABEL_KEY_SEPARATOR)[0].replace(".", CHOISE_LABEL_KEY_SEPARATOR)
}
