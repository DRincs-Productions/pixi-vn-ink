/**
 * https://github.com/inkle/ink/blob/master/Documentation/ink_JSON_runtime_format.md#variable-reference
 * 
 * Obtain the current value of a named variable, and push it to the evaluation stack.
 * 
 * Example:
 * 
 * {"VAR?": "danger"} - Get an existing global or temporary variable named danger and push its value to the evaluation stack.
 */
type VariableReference = {
    "VAR?": string
}
export default VariableReference
