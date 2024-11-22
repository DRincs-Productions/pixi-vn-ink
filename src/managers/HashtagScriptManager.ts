import { SoundOptions, SoundPlayOptions, StepLabelPropsType } from "@drincs/pixi-vn";
import { PixiVNJsonCanvasEffect, PixiVNJsonCanvasTicker, PixiVNJsonLabelStep, PixiVNJsonMediaTransiotions, PixiVNJsonOperation } from "@drincs/pixi-vn-json";

const SPACE_SEPARATOR = "§SPACE§";
const DOUBLE_QUOTES_CONVERTER = "§DOUBLE_QUOTES§";
const QUOTES_CONVERTER = "§QUOTES§";
const SPECIAL_QUOTES_CONVERTER = "SPECIAL_§QUOTES§";
const CURLY_BRACKETS_CONVERTER1 = "§CURLY_BRACKETS1§";
const CURLY_BRACKETS_CONVERTER2 = "§CURLY_BRACKETS2§";
const IMAGES_TYPES = ["show", "edit", "remove", "move"]
const SOUND_TYPES = ["add", "play", "pause", "resume", "remove", "volume"]


export default class HashtagScriptManager {
    private static _customHashtagScript: (script: string[], props: StepLabelPropsType, convertListStringToObj: (listParm: string[]) => object) => boolean = (_script: string[]) => false;
    private static runCustomHashtagScript(script: string[], props: StepLabelPropsType): boolean {
        return HashtagScriptManager._customHashtagScript(script, props, HashtagScriptManager.convertListStringToObj);
    }
    static set customHashtagScript(value: (script: string[], props: StepLabelPropsType, convertListStringToObj: (listParm: string[]) => object) => boolean) {
        HashtagScriptManager._customHashtagScript = value;
    }

    static async generateOrRunOperationFromHashtagScript(comment: string, step: PixiVNJsonLabelStep, props: StepLabelPropsType): Promise<PixiVNJsonOperation | undefined> {
        try {
            comment = comment.replaceAll("\\\"", DOUBLE_QUOTES_CONVERTER);
            comment = comment.replaceAll("\\'", QUOTES_CONVERTER);
            comment = comment.replaceAll("\\`", SPECIAL_QUOTES_CONVERTER);
            comment = comment.replaceAll("\\{", CURLY_BRACKETS_CONVERTER1);
            comment = comment.replaceAll("\\}", CURLY_BRACKETS_CONVERTER2);
            comment = comment.replaceAll("{", " { ");
            comment = comment.replaceAll("}", " } ");
            comment = comment.replaceAll(CURLY_BRACKETS_CONVERTER1, "{");
            comment = comment.replaceAll(CURLY_BRACKETS_CONVERTER2, "}");
            let list: string[] = []
            // for string characters
            let startComment: "\"" | "'" | "`" | undefined = undefined;
            let temp = "";
            for (let i = 0; i < comment.length; i++) {
                let char = comment[i];
                if (char === "\"" || char === "'" || char === "`") {
                    if (startComment === undefined) {
                        list.push(temp);
                        temp = "";
                        startComment = char;
                        temp += char;
                    }
                    else if (startComment === char) {
                        startComment = undefined;
                        temp += char;
                        list.push(temp);
                        temp = "";
                    }
                    else {
                        temp += char;
                    }
                }
                else {
                    temp += char;
                }
            }
            if (temp !== "") {
                list.push(temp);
            }

            list.forEach((item, index) => {
                // if index is shots
                if (index % 2 === 1) {
                    list[index] = item.replaceAll(" ", SPACE_SEPARATOR);
                }
            })
            comment = list.join("");
            list = comment.split(" ").filter((item) => item !== "");
            list = list.map((item) => item
                .replaceAll(SPACE_SEPARATOR, " ")
                .replaceAll(DOUBLE_QUOTES_CONVERTER, "\"")
                .replaceAll(QUOTES_CONVERTER, "'")
                .replaceAll(SPECIAL_QUOTES_CONVERTER, "`")
            )

            // If is a custom command, it will run the custom operation
            if (HashtagScriptManager.runCustomHashtagScript(list, props)) {
                return undefined;
            }

            let operationType = HashtagScriptManager.removeExtraDoubleQuotes(list[1]);
            let type = HashtagScriptManager.removeExtraDoubleQuotes(list[0]);
            switch (operationType) {
                case "image":
                    return HashtagScriptManager.getImageOperationFromComment(list, "image");
                case "video":
                    if (IMAGES_TYPES.includes(type)) {
                        return HashtagScriptManager.getImageOperationFromComment(list, "video");
                    }
                    if (type === "pause" || type === "resume") {
                        return {
                            type: "video",
                            operationType: type as any,
                            alias: HashtagScriptManager.removeExtraDoubleQuotes(list[2])
                        }
                    }
                case "sound":
                    return HashtagScriptManager.getSoundOperationFromComment(list);
                case "input":
                    if (type === "request") {
                        let op: PixiVNJsonOperation = {
                            type: "input",
                            operationType: "request",
                        }
                        if (list.length > 2) {
                            op.valueType = HashtagScriptManager.removeExtraDoubleQuotes(list[2]);
                        }
                        return op;
                    }
                default:
                    if (operationType) {
                        switch (type) {
                            case "call":
                            case "jump":
                                step.labelToOpen = {
                                    label: operationType,
                                    type: type,
                                }
                                step.goNextStep = undefined
                                break
                            case "fade":
                            case "move":
                            case "rotate":
                            case "zoom":
                            case "shake":
                                let propsEffect = {}
                                if (list.length > 2) {
                                    try {
                                        propsEffect = HashtagScriptManager.convertListStringToObj(list.slice(2))
                                    }
                                    catch (_) { }
                                }
                                if (type == "move" && (!("destination" in propsEffect)) && (!("x" in propsEffect) || !("y" in propsEffect))) {
                                    console.error("[Pixi’VN Ink] The move operation must have a x and y or destination property", comment)
                                    return undefined;
                                }
                                else if (type == "move" && "x" in propsEffect && "y" in propsEffect) {
                                    (propsEffect as any)["destination"] = { x: propsEffect.x, y: propsEffect.y }
                                    delete propsEffect.x
                                    delete propsEffect.y
                                }
                                let effect: PixiVNJsonCanvasEffect | PixiVNJsonCanvasTicker = {
                                    alias: operationType,
                                    type: type,
                                    props: propsEffect as any
                                }
                                return effect
                        }
                    }
            }
        }
        catch (e) {
            console.error("[Pixi’VN Ink] Error parsing ink hashtag-script", comment)
            throw e
        }
        return undefined;
    }

    private static getImageOperationFromComment(list: string[], typeCanvasElement: "image" | "video"): PixiVNJsonOperation | undefined {
        let type = HashtagScriptManager.removeExtraDoubleQuotes(list[0]);
        if (!IMAGES_TYPES.includes(type)) {
            return undefined;
        }
        let imageId = HashtagScriptManager.removeExtraDoubleQuotes(list[2]);
        if (type === "show") {
            let op: PixiVNJsonOperation = {
                type: typeCanvasElement,
                operationType: "show",
                alias: imageId,
                url: HashtagScriptManager.removeExtraDoubleQuotes(list[3]),
            }
            if (list.length > 4) {
                let propList = list.slice(4);
                if (list.includes("with")) {
                    let transitionList = list.slice(list.indexOf("with") + 1);
                    propList = list.slice(4, list.indexOf("with"));
                    let transition = HashtagScriptManager.getTransition(transitionList);
                    if (transition !== undefined) {
                        op.transition = transition;
                    }
                }
                if (propList.length > 0) {
                    let props = HashtagScriptManager.convertListStringToObj(propList);
                    op.props = props as any;
                }
            }
            return op;
        }
        else if (type === "edit") {
            let op: PixiVNJsonOperation = {
                type: typeCanvasElement,
                operationType: "edit",
                alias: imageId,
                props: HashtagScriptManager.convertListStringToObj(list.slice(3)) as any
            }
            return op;
        }
        else if (type === "remove") {
            let op: PixiVNJsonOperation = {
                type: typeCanvasElement,
                operationType: "remove",
                alias: imageId,
            }
            if (list.length > 4 && list[3] === "with") {
                let transitionList = list.slice(4);
                let transition = HashtagScriptManager.getTransition(transitionList);
                if (transition !== undefined) {
                    op.transition = transition;
                }
            }
            return op;
        }
        return undefined;
    }

    private static getSoundOperationFromComment(list: string[]): PixiVNJsonOperation | undefined {
        let type = HashtagScriptManager.removeExtraDoubleQuotes(list[0]);
        if (!SOUND_TYPES.includes(type)) {
            return undefined;
        }
        let soundId = HashtagScriptManager.removeExtraDoubleQuotes(list[2]);
        if (type === "add") {
            let op: PixiVNJsonOperation = {
                type: "sound",
                operationType: "add",
                alias: soundId,
                url: HashtagScriptManager.removeExtraDoubleQuotes(list[3]),
            }
            if (list.length > 4) {
                let props = HashtagScriptManager.getSoundOption(list.slice(4));
                if (props !== undefined) {
                    op.props = props;
                }
            }
            return op;
        }
        else if (type === "play") {
            let op: PixiVNJsonOperation = {
                type: "sound",
                operationType: "play",
                alias: soundId,
            }
            if (list.length > 3) {
                let props = HashtagScriptManager.getSoundPlayOptions(list.slice(3));
                if (props !== undefined) {
                    op.props = props;
                }
            }
            return op;
        }
        else if (type === "pause" || type === "resume") {
            let op: PixiVNJsonOperation = {
                type: "sound",
                operationType: type as any,
                alias: soundId,
            }
            return op;
        }
        else if (type === "remove") {
            let op: PixiVNJsonOperation = {
                type: "sound",
                operationType: "remove",
                alias: soundId,
            }
            return op;
        }
        else if (type === "volume") {
            // varse Float or Int
            let number = parseFloat(list[3]);
            let op: PixiVNJsonOperation = {
                type: "sound",
                operationType: "volume",
                alias: soundId,
                value: number,
            }
            return op;
        }
        return undefined;
    }

    private static getTransition(list: string[]): PixiVNJsonMediaTransiotions | undefined {
        let transitionTypes = ["dissolve", "fade", "movein", "moveout", "zoomin", "zoomout", "pushin", "pushout"];
        if (!transitionTypes.includes(list[0])) {
            return undefined;
        }
        let transition: PixiVNJsonMediaTransiotions = {
            type: list[0] as any
        }
        if (list.length > 1) {
            try {
                let props = HashtagScriptManager.convertListStringToObj(list.slice(1));
                transition.props = props;
            }
            catch (_) { }
        }
        return transition;
    }

    private static getSoundOption(list: string[]): SoundOptions | undefined {
        try {
            return HashtagScriptManager.convertListStringToObj(list);
        }
        catch (_) {
            return undefined;
        }
    }
    private static getSoundPlayOptions(list: string[]): SoundPlayOptions | undefined {
        try {
            return HashtagScriptManager.convertListStringToObj(list);
        }
        catch (_) {
            return undefined;
        }
    }

    /**
     * For example: 
     * Into Ink text:
     * duration 3 name "C J" surname Smith position "{ x: 2, y 3 }"
     * into string list:
     * ["duration", "3", "x", "2", "y", "3", "name", "C J", "surname", "Smith", "position", "{ x: 2, y 3 }"]
     * into object:
     * { "duration": 3, "x": 2, "y": 3, "name": "C J", "surname": "Smith", "position": { x: 2, y 3 } }
     */
    private static convertListStringToObj(listParm: string[]): object {
        let list: string[] = []
        let curly_brackets = 0;
        let temp = "";
        for (let i = 0; i < listParm.length; i++) {
            let item = listParm[i];
            if (item.startsWith("{")) {
                curly_brackets++;
                temp += item;
            }
            else if (item.endsWith("}") && curly_brackets > 0) {
                curly_brackets--;
                temp += item;
                if (curly_brackets === 0) {
                    list.push(temp);
                    temp = "";
                }
            }
            else if (curly_brackets > 0) {
                temp += item;
            }
            else {
                list.push(item);
            }
        }
        let objJson: string = "{"
        list.forEach((item, index) => {
            if (index % 2 === 0) {
                objJson += `"${item}": `
            } else {
                objJson += `${item}`
                if (index < list.length - 1) {
                    objJson += ", ";
                }
            }
        })
        objJson += "}"
        try {
            return JSON.parse(objJson);
        }
        catch (e) {
            console.error("[Pixi’VN Ink] Error parsing ink json", objJson)
            throw e
        }
    }

    private static removeExtraDoubleQuotes(value: string): string {
        if (value.startsWith("\"") && value.endsWith("\"")) {
            return value.substring(1, value.length - 1);
        }
        if (value.startsWith("\'") && value.endsWith("\'")) {
            return value.substring(1, value.length - 1);
        }
        if (value.startsWith("\`") && value.endsWith("\`")) {
            return value.substring(1, value.length - 1);
        }
        return value;
    }

}