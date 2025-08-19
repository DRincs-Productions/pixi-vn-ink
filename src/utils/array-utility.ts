export function unionStringOrArray<T = object | string>(start: string | T[] = "", end: string | T[] = ""): T[] {
    const startArray = Array.isArray(start) ? start : [start];
    const endArray = Array.isArray(end) ? end : [end];
    return [...new Set([...startArray, ...endArray])] as T[];
}