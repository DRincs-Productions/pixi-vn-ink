import { CHOISE_LABEL_KEY_SEPARATOR } from "../constant"

export function getLabelByStandardDivert(divertName: string, labelKey: string): string {
    while ((new RegExp(/^\.\^.*$/)).test(divertName)) {
        divertName = divertName.substring(2)
    }

    if (
        // if there are a sub label "=label"
        (new RegExp(/^\..*$/)).test(divertName)
        && labelKey
    ) {
        let endOfLabel = divertName.substring(1)
        return labelKey.split(CHOISE_LABEL_KEY_SEPARATOR)[0] + CHOISE_LABEL_KEY_SEPARATOR + endOfLabel
    }
    return divertName || labelKey.split(CHOISE_LABEL_KEY_SEPARATOR)[0]
}
