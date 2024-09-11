/**
 * https://github.com/inkle/ink/blob/master/Documentation/ink_JSON_runtime_format.md#native-functions
 * 
 * These are mathematical and logical functions that pop 1 or 2 arguments from the evaluation stack, evaluate the result, and push the result back onto the evaluation stack. The following operators are supported:
 * 
 * "+", "-", "/", "*", "%" (mod), "_" (unary negate), "==", ">", "<", ">=", "<=", "!=", "!" (unary 'not'), "&&", "||", "MIN", "MAX"
 * 
 * Booleans are supported only in the C-style - i.e. as integers where non-zero is treated as "true" and zero as "false". The true result of a boolean operation is pushed to the evaluation stack as 1.
 */
type NativeFunctions = "+" | "-" | "/" | "*" | "%" | "_" | "==" | ">" | "<" | ">=" | "<=" | "!=" | "!" | "&&" | "||" | "MIN" | "MAX"
export default NativeFunctions

export const nativeFunctions: NativeFunctions[] = ["+", "-", "/", "*", "%", "_", "==", ">", "<", ">=", "<=", "!=", "!", "&&", "||", "MIN", "MAX"]

export type ArithmeticFunctions = NativeFunctions | "POW" | "RANDOM" | "INT" | "FLOOR" | "FLOAT"
export const arithmeticFunctions: ArithmeticFunctions[] = [...nativeFunctions, "POW", "RANDOM"]
export const arithmeticFunctionsSingle: ArithmeticFunctions[] = ["INT", "FLOOR", "FLOAT"]