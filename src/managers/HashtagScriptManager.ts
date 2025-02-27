import { SoundOptions, SoundPlayOptions, StepLabelPropsType } from "@drincs/pixi-vn";
import {
    PixiVNJsonCanvasEffect,
    PixiVNJsonCanvasTicker,
    PixiVNJsonLabelStep,
    PixiVNJsonMediaTransiotions,
    PixiVNJsonOperation,
} from "@drincs/pixi-vn-json";
import { PixiVNJsonCanvasShow } from "@drincs/pixi-vn-json/dist/interface/PixiVNJsonCanvas";
import { logger } from "../functions/log-utility";

const SPACE_SEPARATOR = "§SPACE§";
const DOUBLE_QUOTES_CONVERTER = "§DOUBLE_QUOTES§";
const QUOTES_CONVERTER = "§QUOTES§";
const SPECIAL_QUOTES_CONVERTER = "SPECIAL_§QUOTES§";
const CURLY_BRACKETS_CONVERTER1 = "§CURLY_BRACKETS1§";
const CURLY_BRACKETS_CONVERTER2 = "§CURLY_BRACKETS2§";
const SOUND_TYPES = ["add", "play", "pause", "resume", "remove", "volume"];

export default class HashtagScriptManager {
    private static _customHashtagScript: (
        script: string[],
        props: StepLabelPropsType,
        convertListStringToObj: (listParm: string[]) => object
    ) => boolean | string = (_script: string[]) => false;
    private static runCustomHashtagScript(script: string[], props: StepLabelPropsType): boolean | string {
        return HashtagScriptManager._customHashtagScript(script, props, HashtagScriptManager.convertListStringToObj);
    }
    static set customHashtagScript(
        value: (
            script: string[],
            props: StepLabelPropsType,
            convertListStringToObj: (listParm: string[]) => object
        ) => boolean | string
    ) {
        HashtagScriptManager._customHashtagScript = value;
    }

    static async generateOrRunOperationFromHashtagScript(
        comment: string,
        step: PixiVNJsonLabelStep,
        props: StepLabelPropsType
    ): Promise<PixiVNJsonOperation | undefined> {
        try {
            comment = comment.replaceAll('\\"', DOUBLE_QUOTES_CONVERTER);
            comment = comment.replaceAll("\\'", QUOTES_CONVERTER);
            comment = comment.replaceAll("\\`", SPECIAL_QUOTES_CONVERTER);
            comment = comment.replaceAll("\\{", CURLY_BRACKETS_CONVERTER1);
            comment = comment.replaceAll("\\}", CURLY_BRACKETS_CONVERTER2);
            comment = comment.replaceAll("{", " { ");
            comment = comment.replaceAll("}", " } ");
            comment = comment.replaceAll(CURLY_BRACKETS_CONVERTER1, "{");
            comment = comment.replaceAll(CURLY_BRACKETS_CONVERTER2, "}");
            let list: string[] = [];
            // for string characters
            let startComment: '"' | "'" | "`" | undefined = undefined;
            let temp = "";
            for (let i = 0; i < comment.length; i++) {
                let char = comment[i];
                if (char === '"' || char === "'" || char === "`") {
                    if (startComment === undefined) {
                        list.push(temp);
                        temp = "";
                        startComment = char;
                        temp += char;
                    } else if (startComment === char) {
                        startComment = undefined;
                        temp += char;
                        list.push(temp);
                        temp = "";
                    } else {
                        temp += char;
                    }
                } else {
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
            });
            comment = list.join("");
            list = comment.split(" ").filter((item) => item !== "");
            list = list.map((item) =>
                item
                    .replaceAll(SPACE_SEPARATOR, " ")
                    .replaceAll(DOUBLE_QUOTES_CONVERTER, '"')
                    .replaceAll(QUOTES_CONVERTER, "'")
                    .replaceAll(SPECIAL_QUOTES_CONVERTER, "`")
            );

            // If is a custom command, it will run the custom operation
            let customCommand = HashtagScriptManager.runCustomHashtagScript(list, props);
            if (customCommand === true) {
                return undefined;
            } else if (typeof customCommand === "string") {
                if (customCommand.startsWith("#")) {
                    customCommand = customCommand.substring(1);
                }
                return HashtagScriptManager.generateOrRunOperationFromHashtagScript(customCommand, step, props);
            }

            let operationType = list.length > 1 ? HashtagScriptManager.removeExtraDoubleQuotes(list[1]) : "";
            let type = list.length > 0 ? HashtagScriptManager.removeExtraDoubleQuotes(list[0]) : "";
            switch (operationType) {
                case "image":
                case "imagecontainer":
                case "canvaselement":
                case "video":
                    if (operationType === "video" && (type === "pause" || type === "resume")) {
                        return {
                            type: "video",
                            operationType: type as any,
                            alias: HashtagScriptManager.removeExtraDoubleQuotes(list[2]),
                        };
                    } else {
                        return HashtagScriptManager.getCanvasOperationFromComment(list, operationType);
                    }
                case "sound":
                    return HashtagScriptManager.getSoundOperationFromComment(list);
                case "input":
                    if (type === "request") {
                        let op: PixiVNJsonOperation = {
                            type: "input",
                            operationType: "request",
                        };
                        if (list.length > 2) {
                            try {
                                let propList = list.slice(2);
                                let props = HashtagScriptManager.convertListStringToObj(propList);
                                if ("type" in props && typeof props.type === "string") {
                                    op.valueType = props.type;
                                }
                                if ("default" in props) {
                                    op.defaultValue = props.default;
                                }
                            } catch (_) {}
                        }
                        return op;
                    }
                case "assets":
                    if (type === "load") {
                        let op: PixiVNJsonOperation = {
                            type: "assets",
                            operationType: "load",
                            assets: list.slice(2),
                        };
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
                                };
                                step.goNextStep = undefined;
                                break;
                            case "fade":
                            case "move":
                            case "rotate":
                            case "zoom":
                            case "shake":
                                let propsEffect = {};
                                if (list.length > 2) {
                                    try {
                                        propsEffect = HashtagScriptManager.convertListStringToObj(list.slice(2));
                                    } catch (_) {}
                                }
                                if (type == "move" && "x" in propsEffect && "y" in propsEffect) {
                                    (propsEffect as any)["destination"] = {
                                        x: propsEffect.x,
                                        y: propsEffect.y,
                                        type: "pixel",
                                    };
                                    delete propsEffect.x;
                                    delete propsEffect.y;
                                }
                                if (type == "move" && "xAlign" in propsEffect && "yAlign" in propsEffect) {
                                    (propsEffect as any)["destination"] = {
                                        x: propsEffect.xAlign,
                                        y: propsEffect.yAlign,
                                        type: "align",
                                    };
                                    delete propsEffect.xAlign;
                                    delete propsEffect.yAlign;
                                }
                                if (type == "move" && "xPercentage" in propsEffect && "yPercentage" in propsEffect) {
                                    (propsEffect as any)["destination"] = {
                                        x: propsEffect.xPercentage,
                                        y: propsEffect.yPercentage,
                                        type: "percentage",
                                    };
                                    delete propsEffect.xPercentage;
                                    delete propsEffect.yPercentage;
                                }
                                if (type == "move" && !("destination" in propsEffect)) {
                                    logger.error(
                                        "The move operation don't have a destination or destination is not valid",
                                        propsEffect
                                    );
                                    return undefined;
                                }
                                let effect: PixiVNJsonCanvasEffect | PixiVNJsonCanvasTicker = {
                                    alias: operationType,
                                    type: type,
                                    props: propsEffect as any,
                                };
                                return effect;
                        }
                    } else {
                        switch (type) {
                            case "pause":
                                if ("dialogue" in step) {
                                    delete step.dialogue;
                                }
                                if ("goNextStep" in step) {
                                    delete step.goNextStep;
                                }
                                break;
                        }
                    }
            }
        } catch (e) {
            logger.error("Error parsing ink hashtag-script", comment);
            throw e;
        }
        return undefined;
    }

    private static getCanvasOperationFromComment(
        list: string[],
        typeCanvasElement: "image" | "video" | "imagecontainer" | "canvaselement"
    ): PixiVNJsonOperation | undefined {
        let type = HashtagScriptManager.removeExtraDoubleQuotes(list[0]);
        let imageId = HashtagScriptManager.removeExtraDoubleQuotes(list[2]);
        let propsList = HashtagScriptManager.convertListStringToPropList(list.slice(3));
        switch (type) {
            case "show":
                switch (typeCanvasElement) {
                    case "image":
                    case "video":
                        return HashtagScriptManager.getImageOperationFromComment(typeCanvasElement, imageId, propsList);
                    case "imagecontainer":
                        return HashtagScriptManager.getContainerOperationFromComment(
                            typeCanvasElement,
                            imageId,
                            propsList
                        );
                    case "canvaselement":
                    default:
                        logger.error("This show operation is not valid for this type of element", typeCanvasElement);
                }
            case "edit":
                let editOp: PixiVNJsonOperation = {
                    type: typeCanvasElement,
                    operationType: "edit",
                    alias: imageId,
                    props: HashtagScriptManager.convertPropListStringToObj(propsList) as any,
                };
                return editOp;
            case "remove":
                let removeOp: PixiVNJsonOperation = {
                    type: typeCanvasElement,
                    operationType: "remove",
                    alias: imageId,
                };
                if (propsList.length > 1 && propsList[0] === "with") {
                    let transitionType = list[list.indexOf("with") + 1];
                    let transitionList = list.slice(list.indexOf("with") + 2);
                    let transition = HashtagScriptManager.getTransition(transitionType, transitionList);
                    if (transition !== undefined) {
                        removeOp.transition = transition;
                    }
                }
                return removeOp;
            default:
                logger.error("The operation type is not valid", type);
        }
        return undefined;
    }
    private static getImageOperationFromComment(
        typeCanvasElement: "image" | "video",
        imageId: string,
        list: string[]
    ): PixiVNJsonOperation | undefined {
        let url: string;
        let propList: string[];
        if (list.length % 2 === 0) {
            url = imageId;
            propList = list;
        } else {
            url = HashtagScriptManager.removeExtraDoubleQuotes(list[0]);
            propList = HashtagScriptManager.convertListStringToPropList(list.slice(1));
        }
        let op: PixiVNJsonOperation = {
            type: typeCanvasElement,
            operationType: "show",
            alias: imageId,
            url: url,
        };
        return HashtagScriptManager.setShowProps(op, propList);
    }
    private static getContainerOperationFromComment(
        typeCanvasElement: "imagecontainer",
        imageId: string,
        list: string[]
    ): PixiVNJsonOperation | undefined {
        // show imagecontainer container1 [image1 image2 image3 ] x 0 with dissolve
        let urls = [];
        let startIndex = list.findIndex((item) => item.startsWith("["));
        let endIndex = list.findIndex((item) => item.endsWith("]"));
        if (startIndex === -1 || endIndex === -1) {
            logger.error("Show imagecontainer must have a list of image ulrs", list);
            return undefined;
        }
        urls = list.slice(startIndex, endIndex + 1);
        if (urls.length < 2) {
            logger.error("Show imagecontainer must have a list of image ulrs", list);
            return undefined;
        }
        if (urls[0] === "[") {
            urls.shift();
        } else {
            urls[0] = urls[0].substring(1);
        }
        if (urls[urls.length - 1] === "]") {
            urls.pop();
        } else {
            urls[urls.length - 1] = urls[urls.length - 1].substring(0, urls[urls.length - 1].length - 1);
        }
        let op: PixiVNJsonOperation = {
            type: typeCanvasElement,
            operationType: "show",
            alias: imageId,
            urls: urls.map((item) => HashtagScriptManager.removeExtraDoubleQuotes(item)),
        };
        let propList = HashtagScriptManager.convertListStringToPropList(list.slice(endIndex + 1));
        return HashtagScriptManager.setShowProps(op, propList);
    }

    private static getSoundOperationFromComment(list: string[]): PixiVNJsonOperation | undefined {
        let type = HashtagScriptManager.removeExtraDoubleQuotes(list[0]);
        if (!SOUND_TYPES.includes(type)) {
            return undefined;
        }
        let soundId = HashtagScriptManager.removeExtraDoubleQuotes(list[2]);
        switch (type) {
            case "play":
                let opplay: PixiVNJsonOperation = {
                    type: "sound",
                    operationType: "play",
                    alias: soundId,
                };
                if (list.length > 3) {
                    let props = HashtagScriptManager.getSoundPlayOptions(list.slice(3));
                    if (props !== undefined) {
                        opplay.props = props;
                    }
                }
                return opplay;
            case "pause":
            case "resume":
                let oppause: PixiVNJsonOperation = {
                    type: "sound",
                    operationType: type as any,
                    alias: soundId,
                };
                return oppause;
            case "stop":
            case "remove":
                let opremove: PixiVNJsonOperation = {
                    type: "sound",
                    operationType: "stop",
                    alias: soundId,
                };
                return opremove;
            case "volume":
                // varse Float or Int
                let number = parseFloat(list[3]);
                let opvolume: PixiVNJsonOperation = {
                    type: "sound",
                    operationType: "volume",
                    alias: soundId,
                    value: number,
                };
                return opvolume;
        }
        return undefined;
    }

    private static setShowProps(op: PixiVNJsonCanvasShow, propList: string[]): PixiVNJsonCanvasShow {
        if (propList.length > 0) {
            if (propList.includes("with") && propList.length > propList.indexOf("with") + 1) {
                let transitionType = propList[propList.indexOf("with") + 1];
                let transitionList = propList.slice(propList.indexOf("with") + 2);
                propList = propList.slice(0, propList.indexOf("with"));
                let transition = HashtagScriptManager.getTransition(transitionType, transitionList);
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
    private static getTransition(transitionType: string, propsList: string[]): PixiVNJsonMediaTransiotions | undefined {
        switch (transitionType) {
            case "dissolve":
            case "fade":
            case "movein":
            case "moveout":
            case "zoomin":
            case "zoomout":
            case "pushin":
            case "pushout":
                break;
            default:
                return undefined;
        }
        let transition: PixiVNJsonMediaTransiotions = {
            type: transitionType,
        };
        if (propsList.length > 0) {
            try {
                let props = HashtagScriptManager.convertPropListStringToObj(propsList);
                transition.props = props;
            } catch (_) {}
        }
        return transition;
    }

    private static getSoundOption(list: string[]): SoundOptions | undefined {
        try {
            return HashtagScriptManager.convertListStringToObj(list);
        } catch (_) {
            return undefined;
        }
    }
    private static getSoundPlayOptions(list: string[]): SoundPlayOptions | undefined {
        try {
            return HashtagScriptManager.convertListStringToObj(list);
        } catch (_) {
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
        let list: string[] = HashtagScriptManager.convertListStringToPropList(listParm);
        return HashtagScriptManager.convertPropListStringToObj(list);
    }
    private static convertListStringToPropList(listParm: string[]): string[] {
        let list: string[] = [];
        let curly_brackets = 0;
        let temp = "";
        for (let i = 0; i < listParm.length; i++) {
            let item = listParm[i];
            if (item.startsWith("{")) {
                curly_brackets++;
                temp += item;
            } else if (item.endsWith("}") && curly_brackets > 0) {
                curly_brackets--;
                temp += item;
                if (curly_brackets === 0) {
                    list.push(temp);
                    temp = "";
                }
            } else if (curly_brackets > 0) {
                temp += item;
            } else {
                list.push(item);
            }
        }
        return list;
    }
    private static convertPropListStringToObj(list: string[]): object {
        if (list.length % 2 !== 0) {
            logger.error("The props list must have a pair number of elements", list);
            throw new Error("The props list must have a pair number of elements");
        }
        let objJson: string = "{";
        list.forEach((item, index) => {
            if (index % 2 === 0) {
                objJson += `"${item}": `;
            } else {
                switch (item) {
                    case "null":
                    case "undefined":
                    case "true":
                    case "false":
                        objJson += `${item}`;
                        break;
                    default:
                        if (HashtagScriptManager.containExtraDoubleQuotes(item)) {
                            item = HashtagScriptManager.removeExtraDoubleQuotes(item);
                            objJson += `"${item}"`;
                        } else if (item.startsWith("{") && item.endsWith("}")) {
                            objJson += `${item}`;
                        } else if (item.startsWith('"') && item.endsWith('"')) {
                            objJson += `${item}`;
                        } else if (!isNaN(parseFloat(item))) {
                            objJson += `${item}`;
                        } else {
                            objJson += `"${item}"`;
                        }
                }
                if (index < list.length - 1) {
                    objJson += ", ";
                }
            }
        });
        objJson += "}";
        try {
            return JSON.parse(objJson);
        } catch (e) {
            logger.error("Error parsing ink json", objJson);
            throw e;
        }
    }

    private static removeExtraDoubleQuotes(value: string): string {
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.substring(1, value.length - 1);
        }
        if (value.startsWith("'") && value.endsWith("'")) {
            return value.substring(1, value.length - 1);
        }
        if (value.startsWith("`") && value.endsWith("`")) {
            return value.substring(1, value.length - 1);
        }
        return value;
    }
    private static containExtraDoubleQuotes(value: string): boolean {
        if (value.startsWith('"') && value.endsWith('"')) {
            return true;
        }
        if (value.startsWith("'") && value.endsWith("'")) {
            return true;
        }
        if (value.startsWith("`") && value.endsWith("`")) {
            return true;
        }
        return false;
    }
}
