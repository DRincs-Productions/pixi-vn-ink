import type { SoundOptions, SoundPlayOptions, StepLabelPropsType } from "@drincs/pixi-vn";
import type {
    PixiVNJsonCanvasAnimate,
    PixiVNJsonCanvasEffect,
    PixiVNJsonCanvasShow,
    PixiVNJsonLabelStep,
    PixiVNJsonMediaTransiotions,
    PixiVNJsonOperation,
} from "@drincs/pixi-vn-json";
import JSON5 from "json5";
import { logger } from "../functions/log-utility";
import HashtagScriptHandler from "./interfaces/HashtagScriptHandler";

const SPACE_SEPARATOR = "§SPACE§";
const DOUBLE_QUOTES_CONVERTER = "§DOUBLE_QUOTES§";
const QUOTES_CONVERTER = "§QUOTES§";
const SPECIAL_QUOTES_CONVERTER = "SPECIAL_§QUOTES§";
const CURLY_BRACKETS_CONVERTER1 = "§CURLY_BRACKETS1§";
const CURLY_BRACKETS_CONVERTER2 = "§CURLY_BRACKETS2§";
const SOUND_TYPES = ["add", "play", "pause", "resume", "remove", "volume"];

class HashtagScriptStorage {
    static handlers: Array<HashtagScriptHandler> = [(_script: string[]) => false];
}

namespace HashtagScript {
    function runCustomCommand(script: string[], props: StepLabelPropsType): boolean | string {
        const handlers = HashtagScriptStorage.handlers;
        for (let i = 0; i < handlers.length; i++) {
            try {
                const res = handlers[i](script, props, convertListStringToObj);
                if (res === true || typeof res === "string") {
                    return res;
                }
            } catch (e) {
                // ignore handler errors and continue to next
            }
        }
        return false;
    }

    /**
     * This function add a new handler (middleware) that will be called before the system interprets a possible Hashtag-Script that starts with `#`.
     * The developer can use this function to run a custom Hashtag-Script. If the function returns `true`, the system will not interpret the Hashtag-Script.
     * If returns a array of strings, the system will interpret the array as a new Hashtag-Script.
     * @param handler The handler to run a custom Hashtag-Script
     * @example
     * ```ts
     * import { HashtagScript } from 'pixi-vn-ink'
     *
     * HashtagScript.add((script, props, convertListStringToObj) => {
     *    // script: # navigate scene_name prop1 "value 1" prop2 "value 2"
     *    if (script[0] === "navigate" && script.length > 1) {
     *        let prop = undefined
     *        if (script.length > 2) {
     *            prop = convertListStringToObj(script.slice(2))
     *        }
     *        navigateTo(script[1], prop)
     *        return true
     *    }
     *    return false
     * })
     * ```
     */
    export function add(handler: HashtagScriptHandler) {
        HashtagScriptStorage.handlers.push(handler);
    }

    export function clear() {
        HashtagScriptStorage.handlers = [];
    }

    export async function run(
        comment: string,
        step: PixiVNJsonLabelStep,
        props: StepLabelPropsType,
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
                    .replaceAll(SPECIAL_QUOTES_CONVERTER, "`"),
            );

            // If is a custom command, it will run the custom operation
            let customCommand = runCustomCommand(list, props);
            if (customCommand === true) {
                return undefined;
            } else if (typeof customCommand === "string") {
                if (customCommand.startsWith("#")) {
                    customCommand = customCommand.substring(1);
                }
                return HashtagScript.run(customCommand, step, props);
            }

            let operationType = list.length > 1 ? removeExtraDoubleQuotes(list[1]) : "";
            let type = list.length > 0 ? removeExtraDoubleQuotes(list[0]) : "";
            switch (operationType) {
                case "image":
                case "imagecontainer":
                case "canvaselement":
                case "video":
                case "text":
                    if (operationType === "video" && (type === "pause" || type === "resume")) {
                        return {
                            type: "video",
                            operationType: type as any,
                            alias: removeExtraDoubleQuotes(list[2]),
                        };
                    } else {
                        return getCanvasOperationFromComment(list, operationType);
                    }
                case "sound":
                    return getSoundOperationFromComment(list);
                case "input":
                    if (type === "request") {
                        let op: PixiVNJsonOperation = {
                            type: "input",
                            operationType: "request",
                        };
                        if (list.length > 2) {
                            try {
                                let propList = list.slice(2);
                                let props = convertListStringToObj(propList);
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
                    break;
                case "assets":
                case "bundle":
                    switch (type) {
                        case "load":
                        case "lazyload":
                            let op: PixiVNJsonOperation = {
                                type: operationType,
                                operationType: type,
                                aliases: list.slice(2),
                            };
                            return op;
                    }
                    break;
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
                                return;
                            case "shake":
                                let propsEffect = {};
                                if (list.length > 2) {
                                    try {
                                        propsEffect = convertListStringToObj(list.slice(2));
                                    } catch (_) {}
                                }
                                let effect: PixiVNJsonCanvasEffect = {
                                    alias: operationType,
                                    type: type,
                                    props: propsEffect as any,
                                };
                                return effect;
                            case "animate":
                                let keyframes = {};
                                let options = {};
                                if (list.length > 2) {
                                    let keyframesList = list.slice(2);
                                    let optionsList: string[] = [];
                                    if (keyframesList.includes("options")) {
                                        let optionsIndex = keyframesList.indexOf("options");
                                        optionsList = keyframesList.slice(optionsIndex + 1);
                                        keyframesList = keyframesList.slice(0, optionsIndex);
                                    }
                                    try {
                                        keyframes = convertListStringToObj(keyframesList);
                                    } catch (_) {}
                                    if (optionsList.length > 0) {
                                        try {
                                            options = convertListStringToObj(optionsList);
                                        } catch (_) {}
                                    }
                                }
                                let animate: PixiVNJsonCanvasAnimate = {
                                    alias: operationType,
                                    type: type,
                                    keyframes: keyframes,
                                    options: options,
                                };
                                return animate;
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
                                return {
                                    type: "dialogue",
                                    operationType: "clean",
                                };
                            case "continue":
                                step.goNextStep = true;
                                step.glueEnabled = false;
                                return undefined;
                        }
                    }
            }
        } catch (e) {
            logger.error("Error parsing ink hashtag-script", comment);
            throw e;
        }
        logger.error("The operation is not valid", comment);
        return undefined;
    }

    function getCanvasOperationFromComment(
        list: string[],
        typeCanvasElement: "image" | "video" | "imagecontainer" | "canvaselement" | "text",
    ): PixiVNJsonOperation | undefined {
        let type = removeExtraDoubleQuotes(list[0]);
        let imageId = removeExtraDoubleQuotes(list[2]);
        let propsList = convertListStringToPropList(list.slice(3));
        switch (type) {
            case "show":
                switch (typeCanvasElement) {
                    case "image":
                    case "video":
                        return getImageOperationFromComment(typeCanvasElement, imageId, propsList);
                    case "imagecontainer":
                        return getContainerOperationFromComment(typeCanvasElement, imageId, propsList);
                    case "text":
                        return getTextOperationFromComment(typeCanvasElement, imageId, propsList);
                    case "canvaselement":
                    default:
                        logger.error("This show operation is not valid for this type of element", typeCanvasElement);
                }
            case "edit":
                let editOp: PixiVNJsonOperation = {
                    type: typeCanvasElement,
                    operationType: "edit",
                    alias: imageId,
                    props: convertPropListStringToObj(propsList) as any,
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
                    let transition = getTransition(transitionType, transitionList);
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
    function getImageOperationFromComment(
        typeCanvasElement: "image" | "video",
        imageId: string,
        list: string[],
    ): PixiVNJsonOperation | undefined {
        let url: string;
        let propList: string[];
        if (list.length % 2 === 0) {
            url = imageId;
            propList = list;
        } else {
            url = removeExtraDoubleQuotes(list[0]);
            propList = list.slice(1);
        }
        let op: PixiVNJsonOperation = {
            type: typeCanvasElement,
            operationType: "show",
            alias: imageId,
            url: url,
        };
        return setShowProps(op, propList);
    }
    function getTextOperationFromComment(
        typeCanvasElement: "text",
        imageId: string,
        list: string[],
    ): PixiVNJsonOperation | undefined {
        let text: string;
        let propList: string[];
        if (list.length % 2 === 0) {
            text = imageId;
            propList = list;
        } else {
            text = removeExtraDoubleQuotes(list[0]);
            propList = list.slice(1);
        }
        let op: PixiVNJsonOperation = {
            type: typeCanvasElement,
            operationType: "show",
            alias: imageId,
            text: text,
        };
        return setShowProps(op, propList);
    }
    function getContainerOperationFromComment(
        typeCanvasElement: "imagecontainer",
        imageId: string,
        list: string[],
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
            urls: urls.map((item) => removeExtraDoubleQuotes(item)),
        };
        let propList = list.slice(endIndex + 1);
        return setShowProps(op, propList);
    }

    function getSoundOperationFromComment(list: string[]): PixiVNJsonOperation | undefined {
        let type = removeExtraDoubleQuotes(list[0]);
        if (!SOUND_TYPES.includes(type)) {
            return undefined;
        }
        let soundId = removeExtraDoubleQuotes(list[2]);
        switch (type) {
            case "play":
                let opplay: PixiVNJsonOperation = {
                    type: "sound",
                    operationType: "play",
                    alias: soundId,
                };
                if (list.length > 3) {
                    let props = getSoundPlayOptions(list.slice(3));
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

    function setShowProps(op: PixiVNJsonCanvasShow, propList: string[]): PixiVNJsonCanvasShow {
        if (propList.length > 0) {
            if (propList.includes("with") && propList.length > propList.indexOf("with") + 1) {
                let transitionType = propList[propList.indexOf("with") + 1];
                let transitionList = propList.slice(propList.indexOf("with") + 2);
                propList = propList.slice(0, propList.indexOf("with"));
                let transition = getTransition(transitionType, transitionList);
                if (transition !== undefined) {
                    op.transition = transition;
                }
            }
            if (propList.length > 0) {
                let props = convertPropListStringToObj(propList);
                op.props = props as any;
            }
        }
        return op;
    }
    function getTransition(transitionType: string, propsList: string[]): PixiVNJsonMediaTransiotions | undefined {
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
                let props = convertPropListStringToObj(propsList);
                transition.props = props;
            } catch (_) {}
        }
        return transition;
    }

    function getSoundOption(list: string[]): SoundOptions | undefined {
        try {
            return convertListStringToObj(list);
        } catch (_) {
            return undefined;
        }
    }
    function getSoundPlayOptions(list: string[]): SoundPlayOptions | undefined {
        try {
            return convertListStringToObj(list);
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
    function convertListStringToObj(listParm: string[]): object {
        let list: string[] = convertListStringToPropList(listParm);
        return convertPropListStringToObj(list);
    }
    function convertListStringToPropList(listParm: string[]): string[] {
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
    function convertPropListStringToObj(list: string[]): object {
        if (list.length === 0) {
            return {};
        }
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
                        if (containExtraDoubleQuotes(item)) {
                            item = removeExtraDoubleQuotes(item);
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
            return JSON5.parse(objJson);
        } catch (e) {
            logger.error("Error parsing ink json", objJson);
            throw e;
        }
    }

    function removeExtraDoubleQuotes(value: string): string {
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
    function containExtraDoubleQuotes(value: string): boolean {
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
export default HashtagScript;

/**
 * @deprecated This function is deprecated, use {@link HashtagScript.add} instead
 */
export function onInkHashtagScript(runCustomHashtagScript: HashtagScriptHandler) {
    HashtagScript.add(runCustomHashtagScript);
}
