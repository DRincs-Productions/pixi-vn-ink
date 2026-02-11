/**
 * https://github.com/inkle/ink/blob/master/Documentation/ink_JSON_runtime_format.md#read-count
 * 
 * Obtain the read count of a particular named knot, stitch, choice or gather. Note that this is implemented as a Variable Reference with particular flag in the C# ink runtime.
 * 
 * Example:
 * 
 * {"CNT?": "the_hall.light_switch"} - gets the read count of the container at the given path. For example, it might be a stitch named light_switch in a knot called the_hall.
 */
type ReadCount = { "CNT?": string }
export default ReadCount
