export function unionStringOrArray(start: string | string[] = "", end: string | string[] = ""): string[] {
    const startArray = Array.isArray(start) ? start : [start];
    const endArray = Array.isArray(end) ? end : [end];
    return [...new Set([...startArray, ...endArray])];
}