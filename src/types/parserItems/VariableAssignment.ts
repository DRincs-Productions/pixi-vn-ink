import { PixiVNJsonArithmeticOperations, PixiVNJsonValueGet, StorageElementType } from "@drincs/pixi-vn"

type VariableAssignmentVar = {
    "VAR=": any
    "re": true
}
type VariableAssignmentTem = {
    "temp=": string
}

/**
 * https://github.com/inkle/ink/blob/master/Documentation/ink_JSON_runtime_format.md#variable-assignment
 * 
 * Pops a value from the evaluation stack, and assigns it to a named variable, either globally or locally (in a temp, or a passed parameter). The "re" property being set indicates that it's a re-assignment rather than a brand new declaration.
 * 
 * Examples:
 * - {"VAR=": "money", "re": true} - Pop a value from the evaluation stack, and assign it to the already-declared global variable money.
 * - {"temp=": "x"} - Pop a value from the evaluation stack, and assign it to a newly declared temporary variable named x.
 */
type VariableAssignment = VariableAssignmentVar | VariableAssignmentTem
export default VariableAssignment

export type MyVariableAssignment = {
    typeVar: "var" | "tempstorage",
    typeOperation: "set",
    name: string,
    value: StorageElementType | PixiVNJsonValueGet
} | {
    typeVar: "var" | "tempstorage",
    typeOperation: "get",
    name: string,
} | {
    typeVar: "art",
    typeOperation: "get",
    value: PixiVNJsonArithmeticOperations
}