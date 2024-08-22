import { CHOISE_LABEL_KEY_SEPARATOR } from "../constant"
import { StandardDivert } from "../types/parserItems/Divert"

export function getLabelByStandardDivert(divert: StandardDivert, labelKey: string): string {
    if (
        // if there are a sub label "=label"
        (new RegExp(/^\.\^\.\^\.\^\.\^\..*$/)).test(divert["->"])
        && labelKey
    ) {
        let endOfLabel = divert["->"].substring(9)
        return labelKey.split(CHOISE_LABEL_KEY_SEPARATOR)[0] + CHOISE_LABEL_KEY_SEPARATOR + endOfLabel
    }
    else if (
        // if there are a sub label "=label"
        (new RegExp(/^\.\^\.\^\.\^\..*$/)).test(divert["->"])
        && labelKey.includes(CHOISE_LABEL_KEY_SEPARATOR)
    ) {
        let endOfLabel = divert["->"].substring(7)
        return labelKey.split(CHOISE_LABEL_KEY_SEPARATOR)[0] + CHOISE_LABEL_KEY_SEPARATOR + endOfLabel
    }
    else if (
        // if there are a sub label "=label"
        (new RegExp(/^\.\^\.\^\..*$/)).test(divert["->"])
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
            console.error("[Pixi’VN Ink] Unhandled case: labelKey is not include CHOISE_LABEL_KEY_SEPARATOR", divert)
        }
    }
    else if (
        // if there are a sub label "=label"
        (new RegExp(/^\.\^\..*$/)).test(divert["->"])
        && labelKey
    ) {
        let endOfLabel = divert["->"].substring(3)
        return labelKey + CHOISE_LABEL_KEY_SEPARATOR + endOfLabel
    }
    return divert["->"]
}
