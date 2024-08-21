/**
 * Represented with a leading ^ to differentiate from other string-based objects. e.g. "^Hello world" is used in JSON to represent the text Hello world, and "^^ up there ^" would be the text ^ up there ^. No ^ is needed for a newline, so it's just "\n".
 */
type TextType = string
export default TextType
