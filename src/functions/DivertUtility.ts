import { CHOISE_LABEL_KEY_SEPARATOR } from "../constant"

export function getLabelByStandardDivert(divertName: string, labelKey: string): string {
    if (
        // if there are a sub label "=label"
        (new RegExp(/^\.\^\.\^\.\^\.\^\..*$/)).test(divertName)
        && labelKey
    ) {
        let endOfLabel = divertName.substring(9)
        return labelKey.split(CHOISE_LABEL_KEY_SEPARATOR)[0] + CHOISE_LABEL_KEY_SEPARATOR + endOfLabel
    }
    else if (
        // if there are a sub label "=label"
        (new RegExp(/^\.\^\.\^\.\^\..*$/)).test(divertName)
        && labelKey.includes(CHOISE_LABEL_KEY_SEPARATOR)
    ) {
        let endOfLabel = divertName.substring(7)
        return labelKey.split(CHOISE_LABEL_KEY_SEPARATOR)[0] + CHOISE_LABEL_KEY_SEPARATOR + endOfLabel
    }
    else if (
        // if there are a sub label "=label"
        (new RegExp(/^\.\^\.\^\..*$/)).test(divertName)
        && labelKey
    ) {
        if (labelKey.includes(CHOISE_LABEL_KEY_SEPARATOR)) {
            // split labelKey by CHOISE_LABEL_KEY_SEPARATOR
            let newlabelKey = labelKey.split(CHOISE_LABEL_KEY_SEPARATOR)
            if (newlabelKey.length > 1) {
                newlabelKey.pop()
            }
            return newlabelKey.join(CHOISE_LABEL_KEY_SEPARATOR)
        }
        else {
            console.error("[Pixi’VN Ink] Unhandled case: labelKey is not include CHOISE_LABEL_KEY_SEPARATOR", divertName)
        }
    }
    else if (
        // if there are a sub label "=label"
        (new RegExp(/^\.\^\..*$/)).test(divertName)
        && labelKey
    ) {
        let endOfLabel = divertName.substring(3)
        return labelKey + CHOISE_LABEL_KEY_SEPARATOR + endOfLabel
    }
    return divertName
}
