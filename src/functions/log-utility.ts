export namespace logger {
    export const log = (message?: any, ...optionalParams: any[]) =>
        console.log(`[Pixi’VN Ink] ${message}`, ...optionalParams);
    export const warn = (message?: any, ...optionalParams: any[]) =>
        console.warn(`[Pixi’VN Ink] ${message}`, ...optionalParams);
    export const error = (message?: any, ...optionalParams: any[]) =>
        console.error(`[Pixi’VN Ink] ${message}`, ...optionalParams);
    export const info = (message?: any, ...optionalParams: any[]) =>
        console.info(`[Pixi’VN Ink] ${message}`, ...optionalParams);
}
