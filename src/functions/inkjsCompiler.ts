import inkjs from "inkjs";

export function convertorInkToJson(test: string): string {
    try {
        const story = new inkjs.Compiler(test).Compile();
        let json = story.ToJson();
        console.log(json);
        return json;
    } catch (e) {
        console.error("[Pixi'VN] Error compiling ink file", e)
        throw e
    }
}
