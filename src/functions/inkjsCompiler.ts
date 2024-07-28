import inkjs from "inkjs";

function convertor(test: string) {
    try {
        const story = new inkjs.Compiler(test).Compile();
        return story.ToJson();
    } catch (e) {
    }
}
