/**
 * https://github.com/inkle/ink/blob/master/Documentation/ink_JSON_runtime_format.md#control-commands
 * 
 * Control commands are special instructions to the text engine to perform various actions. They are all represented by a particular text string:
 * 
 * - "ev" - Begin logical evaluation mode. In evaluation mode, objects that are encountered are added to an evaluation stack, rather than simply echoed into the main text output stream. As they're pushed onto the stack, they may be processed by other commands, functions, etc.
 * - "/ev" - End logical evaluation mode. Future objects will be appended to the output stream rather than to the evaluation stack.
 * - "out" - The topmost object on the evaluation stack is popped and appended to the output stream (main story output).
 * - "pop" - Pops a value from the evaluation stack, without appending to the output stream.
 * - "->->" and "~ret" pop the callstack - used for returning from a tunnel or function respectively. They are specified independently for error checking, since the callstack is aware of whether each element was pushed as a tunnel or function in the first place.
 * - "du" - Duplicate the topmost object on the evaluation stack. Useful since some commands consume objects on the evaluation stack.
 * - "str" - Begin string evaluation mode. Adds a marker to the output stream, and goes into content mode (from evaluation mode). Must have already been in evaluation mode when this is encountered. See below for explanation.
 * - "/str" - End string evaluation mode. All content after the previous Begin marker is concatenated together, removed from the output stream, and appended as a string value to the evaluation stack. Re-enters evaluation mode immediately afterwards.
 * - "nop" - No-operation. Does nothing, but is useful as an addressable piece of content to divert to.
 * - "choiceCnt" - Pushes an integer with the current number of choices to the evaluation stack.
 * - "turn" - Pushes an integer with the current turn number to the evaluation stack.
 * - "turns" - Pops from the evaluation stack, expecting to see a divert target for a knot, stitch, gather or choice. Pushes an integer with the number of turns since that target was last visited by the story engine.
 * - "visit" - Pushes an integer with the number of visits to the current container by the story engine.
 * - "seq" - Pops an integer, expected to be the number of elements in a sequence that's being entered. In return, it pushes an integer with the next sequence shuffle index to the evaluation stack. This shuffle index is derived from the number of elements in the sequence, the number of elements in it, and the story's random seed from when it was first begun.
 * - "thread" - Clones/starts a new thread, as used with the <- knot syntax in ink. This essentially clones the entire callstack, branching it.
 * - "done" - Tries to close/pop the active thread, otherwise marks the story flow safe to exit without a loose end warning.
 * - "end" - Ends the story flow immediately, closes all active threads, unwinds the callstack, and removes any choices that were previously created.
 */
type ControlCommands = "ev" | "/ev" | "out" | "pop" | "->->" | "~ret" | "du" | "str" | "/str" | "nop" | "choiceCnt" | "turn" | "turns" | "visit" | "seq" | "thread" | "done" | "end"
export default ControlCommands
