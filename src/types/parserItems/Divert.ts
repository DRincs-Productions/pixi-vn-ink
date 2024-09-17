export type StandardDivert = {
    "->": string
    "var"?: true
    c?: boolean
    /**
     * my property to store the parameters
     */
    params?: any[]
}
type DivertFunction = {
    "f()": string
    c?: boolean
}
type DivertTunnel = {
    "->t->": string
    c?: boolean
}
type DivertExternalFunction = {
    "x()": string,
    "exArgs": number
    c?: boolean
}
/**
 * https://github.com/inkle/ink/blob/master/Documentation/ink_JSON_runtime_format.md#divert
 * 
 * Diverts can take the following forms:
 * 
 * - {"->": "path.to.target"} - a standard divert to content at a particular path.
 * - {"->": "variableTarget", "var": true} - as above, except that var specifies that the target is the name of a variable containing a divert target value.
 * - {"f()": "path.to.func"} - a function-call, which is defined as a divert that pushes an element to the callstack. Note that it doesn't necessarily correspond directly to an ink function, since choices use them internally too.
 * - {"->t->": "path.tunnel"} - a tunnel, which works similarly to a function call by pushing an element to the callstack. The only difference is that the callstack is aware of the type of element that was pushed, for error checking.
 * - {"x()": "externalFuncName", "exArgs": 5} - an external (game-side) function call, that optionally takes the specified number of arguments.
 * 
 * Additionally, a "c" property set to true indicates that the divert is conditional, and should therefore pop a value off the evaluation stack to determine whether the divert should actually happen.
 */
type Divert = StandardDivert | DivertFunction | DivertTunnel | DivertExternalFunction
export default Divert