const DOUBLE_SLASH_CONVERTOR = "§DOUBLE_SLASH_CONVERTOR§"
export function getText(text: string): string {
    if (text.startsWith("^")) {
        text = text.substring(1)
    }
    text = text.replaceAll("\\\\", DOUBLE_SLASH_CONVERTOR)
    text = text.replaceAll("\\n", "\n")
    text = text.replaceAll("\\t", "\t")
    text = text.replaceAll(DOUBLE_SLASH_CONVERTOR, "\\\\")
    return text
}
