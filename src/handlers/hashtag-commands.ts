import type { StepLabelPropsType } from "@drincs/pixi-vn";
import type {
    PixiVNJsonCanvasAnimate,
    PixiVNJsonCanvasEffect,
    PixiVNJsonCanvasShow,
    PixiVNJsonLabelStep,
    PixiVNJsonMediaTransiotions,
    PixiVNJsonOperation,
} from "@drincs/pixi-vn-json";
import JSON5 from "json5";
import z, { ZodType } from "zod";
import { logger } from "../utils/log-utility";
import type {
    HashtagHandler,
    HashtagHandlerOptions,
    MapperHandler,
} from "./interfaces/HashtagHandler";

const SPACE_SEPARATOR = "§SPACE§";
const DOUBLE_QUOTES_CONVERTER = "§DOUBLE_QUOTES§";
const QUOTES_CONVERTER = "§QUOTES§";
const SPECIAL_QUOTES_CONVERTER = "SPECIAL_§QUOTES§";
const CURLY_BRACKETS_CONVERTER1 = "§CURLY_BRACKETS1§";
const CURLY_BRACKETS_CONVERTER2 = "§CURLY_BRACKETS2§";

/**
 * This is a container for the functions related to the Hashtag-Command, a system that allows to run custom operations from the Ink command using a special syntax. The Hashtag-Command is a string that starts with `#` and is followed by the operation type and its parameters. The system will interpret the Hashtag-Command and run the corresponding operation before running the step. The developer can also add custom handlers to run custom operations from the Hashtag-Command using the {@link add} function.
 */
export namespace HashtagCommands {
    const handlers: { fn: HashtagHandler; opts: HashtagHandlerOptions }[] = [];
    const mapperHandlers: { fn: MapperHandler; opts: HashtagHandlerOptions }[] = [];
    async function runCustomCommand(
        script: string[],
        props: StepLabelPropsType,
    ): Promise<boolean | string> {
        for (let i = 0; i < handlers.length; i++) {
            try {
                const { validation } = handlers[i].opts;
                // "all" → always invoke this handler
                if (validation instanceof RegExp) {
                    // RegExp → join tokens with a space and test against the pattern
                    if (!validation.test(script.join(" "))) {
                        continue;
                    }
                } else if (validation instanceof ZodType) {
                    // Zod schema → validate the full string[] array
                    const result = validation.safeParse(script);
                    if (!result.success) {
                        continue;
                    }
                }
                const res = await handlers[i].fn(script, props, convertListStringToObj);
                if (res === true || typeof res === "string") {
                    return res;
                }
            } catch (_) {
                // ignore handler errors and continue to next
            }
        }
        return false;
    }

    /**
     * @deprecated Use the two-parameter overload with {@link HashtagHandlerOptions} instead.
     */
    export function add(handler: HashtagHandler): void;
    /**
     * This function add a new handler (middleware) that will be called before the system interprets a possible Hashtag-Command that starts with `#`.
     * The developer can use this function to run a custom Hashtag-Command. If the function returns `true`, the system will not interpret the Hashtag-Command.
     * If returns a array of strings, the system will interpret the array as a new Hashtag-Command.
     * @param handler The handler to run a custom Hashtag-Command
     * @param opts Configuration for this handler, including its name, optional description, and validation rule.
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
     * }, { name: "navigate-command", validation: /^navigate\b/ })
     * ```
     */
    export function add(handler: HashtagHandler, opts: HashtagHandlerOptions): void;
    export function add(
        handler: HashtagHandler,
        opts: HashtagHandlerOptions = {
            name: "custom-command",
            validation: /^/,
        },
    ) {
        handlers.push({ fn: handler, opts });
    }

    /**
     * Registers a new mapper that converts a specific Hashtag-Command pattern into a
     * {@link PixiVNJsonOperation}.
     *
     * Mappers are evaluated in registration order by
     * {@link HashtagCommands.convertOperation} **before** the built-in `switch` table.  The
     * first mapper whose {@link HashtagHandlerOptions.validation} matches the raw token list is
     * called and its return value is used as the operation; subsequent mappers (and the built-in
     * switch) are skipped.
     *
     * Use `addMapper` instead of {@link add} when you want to extend or override the built-in
     * command → operation translation without intercepting the full handler pipeline.
     *
     * @param handler A {@link MapperHandler} that receives the full token list and the current
     *   step, and returns either a {@link PixiVNJsonOperation} or `undefined`.
     * @param opts Configuration including a name, optional description, and the validation rule
     *   used to select this mapper.
     *
     * @example
     * ```ts
     * import { HashtagCommands } from 'pixi-vn-ink'
     * import { z } from 'zod'
     *
     * // Handle: # navigate scene_name
     * HashtagCommands.addMapper(
     *     (list, step) => {
     *         step.labelToOpen = { label: list[1], type: "jump" }
     *         step.goNextStep = undefined
     *         return undefined
     *     },
     *     {
     *         name: "navigate-command",
     *         validation: z.tuple([z.literal("navigate"), z.string()]),
     *     },
     * )
     * ```
     */
    export function addMapper(handler: MapperHandler, opts: HashtagHandlerOptions) {
        mapperHandlers.push({ fn: handler, opts });
    }

    /**
     * This function clear all the handlers added with the {@link add} function.
     */
    export function clear() {
        handlers.length = 0;
    }

    /**
     * Removes all mapper handlers registered with {@link addMapper}.
     *
     * Useful in tests to reset the mapper state between test cases, or in applications that need
     * to replace the default mappers with a custom set.
     */
    export function clearMappers() {
        mapperHandlers.length = 0;
    }

    /**
     * This function run the Hashtag-Command, it will be called before running the step. It will interpret the Hashtag-Command and return the corresponding operation to run before the step. If the Hashtag-Command is not valid, it will return undefined and the system will run the step normally.
     * @param tag The Hashtag-Command to interpret, it is the string that starts with `#` and is followed by the operation type and its parameters.
     * @param step The step that will be run after the Hashtag-Command, the system will run the Hashtag-Command before running the step, so the operation returned by this function will be executed before the step. The step can be modified by the Hashtag-Command, for example, it can change the dialogue or the goNextStep properties of the step.
     * @param props The properties of the step label, it can be used to get information about the step and the label, for example, the label name or the step index. It can also be used to store custom properties that can be accessed by the handlers of the Hashtag-Command.
     * @returns The operation to run before the step, if the Hashtag-Command is not valid, it will return undefined and the system will run the step normally.
     */
    export async function run(
        tag: string,
        step: PixiVNJsonLabelStep,
        props: StepLabelPropsType,
    ): Promise<PixiVNJsonOperation | undefined> {
        try {
            const list = convertTagTolist(tag);

            // If is a custom command, it will run the custom operation
            let customCommand = await runCustomCommand(list, props);
            if (customCommand === true) {
                return undefined;
            } else if (typeof customCommand === "string") {
                if (customCommand.startsWith("#")) {
                    customCommand = customCommand.substring(1);
                }
                return await HashtagCommands.run(customCommand, step, props);
            }

            return convertOperation(list, step);
        } catch (e) {
            logger.error("Error parsing ink hashtag-command", tag);
            throw e;
        }
    }
    export function convertTagTolist(tag: string): string[] {
        tag = tag.replaceAll('\\"', DOUBLE_QUOTES_CONVERTER);
        tag = tag.replaceAll("\\'", QUOTES_CONVERTER);
        tag = tag.replaceAll("\\`", SPECIAL_QUOTES_CONVERTER);
        tag = tag.replaceAll("\\{", CURLY_BRACKETS_CONVERTER1);
        tag = tag.replaceAll("\\}", CURLY_BRACKETS_CONVERTER2);
        tag = tag.replaceAll("{", " { ");
        tag = tag.replaceAll("}", " } ");
        tag = tag.replaceAll(CURLY_BRACKETS_CONVERTER1, "{");
        tag = tag.replaceAll(CURLY_BRACKETS_CONVERTER2, "}");
        let list: string[] = [];
        // for string characters
        let startComment: '"' | "'" | "`" | undefined;
        let temp = "";
        for (let i = 0; i < tag.length; i++) {
            const char = tag[i];
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
        tag = list.join("");
        list = tag.split(" ").filter((item) => item !== "");
        list = list.map((item) =>
            item
                .replaceAll(SPACE_SEPARATOR, " ")
                .replaceAll(DOUBLE_QUOTES_CONVERTER, '"')
                .replaceAll(QUOTES_CONVERTER, "'")
                .replaceAll(SPECIAL_QUOTES_CONVERTER, "`"),
        );
        return list;
    }
    export function convertOperation(
        list: string[],
        step: PixiVNJsonLabelStep,
    ): PixiVNJsonOperation | undefined {
        // Try each registered mapper whose validation matches the raw token list.
        // The first match wins; its return value (including undefined) is used directly.
        for (const mapper of mapperHandlers) {
            const { validation } = mapper.opts;
            let matches = false;
            if (validation instanceof RegExp) {
                matches = validation.test(list.join(" "));
            } else if (validation instanceof ZodType) {
                const result = validation.safeParse(list);
                matches = result.success;
            }
            if (matches) {
                return mapper.fn(list, step);
            }
        }

        const operationType = list.length > 1 ? removeExtraDoubleQuotes(list[1]) : "";
        const type = list.length > 0 ? removeExtraDoubleQuotes(list[0]) : "";
        switch (operationType) {
            case "image":
            case "imagecontainer":
            case "canvaselement":
            case "video":
            case "text":
                return getCanvasOperationFromComment(list, operationType);
            case "sound":
            case "channel":
                return getSoundOperationFromComment(list, operationType);
            default:
                if (operationType) {
                    switch (type) {
                        case "shake": {
                            let propsEffect = {};
                            if (list.length > 2) {
                                try {
                                    propsEffect = convertListStringToObj(list.slice(2));
                                } catch (_) {}
                            }
                            const effect: PixiVNJsonCanvasEffect = {
                                alias: operationType,
                                type: type,
                                props: propsEffect as any,
                            };
                            return effect;
                        }
                        case "animate": {
                            let keyframes = {};
                            let options = {};
                            if (list.length > 2) {
                                let keyframesList = list.slice(2);
                                let optionsList: string[] = [];
                                if (keyframesList.includes("options")) {
                                    const optionsIndex = keyframesList.indexOf("options");
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
                            const animate: PixiVNJsonCanvasAnimate = {
                                alias: operationType,
                                type: type,
                                keyframes: keyframes,
                                options: options,
                            };
                            return animate;
                        }
                    }
                }
        }
        logger.error("The operation is not valid", list);
        return undefined;
    }

    function getCanvasOperationFromComment(
        list: string[],
        typeCanvasElement: "image" | "video" | "imagecontainer" | "canvaselement" | "text",
    ): PixiVNJsonOperation | undefined {
        const type = removeExtraDoubleQuotes(list[0]);
        const imageId = removeExtraDoubleQuotes(list[2]);
        const propsList = convertListStringToPropList(list.slice(3));
        switch (type) {
            case "show":
                switch (typeCanvasElement) {
                    case "image":
                    case "video":
                        return getImageOperationFromComment(typeCanvasElement, imageId, propsList);
                    case "imagecontainer":
                        return getContainerOperationFromComment(
                            typeCanvasElement,
                            imageId,
                            propsList,
                        );
                    case "text":
                        return getTextOperationFromComment(typeCanvasElement, imageId, propsList);
                    default:
                        logger.error(
                            "This show operation is not valid for this type of element",
                            typeCanvasElement,
                        );
                }
                break;
            case "edit": {
                const editOp: PixiVNJsonOperation = {
                    type: typeCanvasElement,
                    operationType: "edit",
                    alias: imageId,
                    props: convertPropListStringToObj(propsList) as any,
                };
                return editOp;
            }
            case "remove": {
                const removeOp: PixiVNJsonOperation = {
                    type: typeCanvasElement,
                    operationType: "remove",
                    alias: imageId,
                };
                if (propsList.length > 1 && propsList[0] === "with") {
                    const transitionType = list[list.indexOf("with") + 1];
                    const transitionList = list.slice(list.indexOf("with") + 2);
                    const transition = getTransition(transitionType, transitionList);
                    if (transition !== undefined) {
                        removeOp.transition = transition;
                    }
                }
                return removeOp;
            }
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
        const op: PixiVNJsonOperation = {
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
        const op: PixiVNJsonOperation = {
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
        const startIndex = list.findIndex((item) => item.startsWith("["));
        const endIndex = list.findIndex((item) => item.endsWith("]"));
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
            urls[urls.length - 1] = urls[urls.length - 1].substring(
                0,
                urls[urls.length - 1].length - 1,
            );
        }
        const op: PixiVNJsonOperation = {
            type: typeCanvasElement,
            operationType: "show",
            alias: imageId,
            urls: urls.map((item) => removeExtraDoubleQuotes(item)),
        };
        const propList = list.slice(endIndex + 1);
        return setShowProps(op, propList);
    }

    function getSoundOperationFromComment(
        list: string[],
        operationType: "sound" | "channel",
    ): PixiVNJsonOperation | undefined {
        const type = removeExtraDoubleQuotes(list[0]);
        const soundId = removeExtraDoubleQuotes(list[2]);
        switch (type) {
            case "play": {
                const tempList = convertListStringToPropList(list.slice(3));
                let url: string;
                let propList: string[];
                if (tempList.length % 2 === 0) {
                    url = soundId;
                    // # sound play soundId prop1 "value 1" prop2 "value 2"
                    propList = tempList;
                } else {
                    url = removeExtraDoubleQuotes(tempList[0]);
                    propList = tempList.slice(1);
                }

                const opplay: PixiVNJsonOperation = {
                    type: "sound",
                    operationType: "play",
                    alias: soundId,
                };
                if (url) {
                    opplay.url = url;
                }
                if (list.length > 3) {
                    const props = convertListStringToObj(propList);
                    if (props !== undefined) {
                        opplay.props = props;
                    }
                }
                return opplay;
            }
            case "stop":
            case "remove": {
                const opremove: PixiVNJsonOperation = {
                    type: "sound",
                    operationType: "stop",
                    alias: soundId,
                };
                return opremove;
            }
            case "edit": {
                const opedit: PixiVNJsonOperation = {
                    type: "sound",
                    operationType: "edit",
                    alias: soundId,
                    props: convertListStringToObj(list.slice(3)),
                };
                return opedit;
            }
        }
        return undefined;
    }

    function setShowProps(op: PixiVNJsonCanvasShow, propList: string[]): PixiVNJsonCanvasShow {
        if (propList.length > 0) {
            if (propList.includes("with") && propList.length > propList.indexOf("with") + 1) {
                const transitionType = propList[propList.indexOf("with") + 1];
                const transitionList = propList.slice(propList.indexOf("with") + 2);
                propList = propList.slice(0, propList.indexOf("with"));
                const transition = getTransition(transitionType, transitionList);
                if (transition !== undefined) {
                    op.transition = transition;
                }
            }
            if (propList.length > 0) {
                const props = convertPropListStringToObj(propList);
                op.props = props as any;
            }
        }
        return op;
    }
    function getTransition(
        transitionType: string,
        propsList: string[],
    ): PixiVNJsonMediaTransiotions | undefined {
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
        const transition: PixiVNJsonMediaTransiotions = {
            type: transitionType,
        };
        if (propsList.length > 0) {
            try {
                const props = convertPropListStringToObj(propsList);
                transition.props = props;
            } catch (_) {}
        }
        return transition;
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
    export function convertListStringToObj(listParm: string[]): object {
        const list: string[] = convertListStringToPropList(listParm);
        return convertPropListStringToObj(list);
    }
    function convertListStringToPropList(listParm: string[]): string[] {
        const list: string[] = [];
        let curly_brackets = 0;
        let temp = "";
        for (let i = 0; i < listParm.length; i++) {
            const item = listParm[i];
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
                        } else if (!Number.isNaN(parseFloat(item))) {
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

/**
 * @deprecated This function is deprecated, use {@link HashtagCommands.add} instead
 */
export function onInkHashtagScript(runCustomHashtagScript: HashtagHandler) {
    HashtagCommands.add(runCustomHashtagScript);
}

HashtagCommands.addMapper(
    (list: string[], step: PixiVNJsonLabelStep) => {
        step.labelToOpen = {
            label: list[1],
            type: "call",
        };
        step.goNextStep = undefined;
    },
    {
        name: "call",
        description:
            "Calls the label specified by the second token, then returns to the current position.",
        validation: z.tuple([z.literal("call"), z.string()]),
    },
);

HashtagCommands.addMapper(
    (list: string[], step: PixiVNJsonLabelStep) => {
        step.labelToOpen = {
            label: list[1],
            type: "jump",
        };
        step.goNextStep = undefined;
    },
    {
        name: "jump",
        description: "Jumps to the label specified by the second token without returning.",
        validation: z.tuple([z.literal("jump"), z.string()]),
    },
);

// # pause  →  clean the current dialogue and halt auto-advance
HashtagCommands.addMapper(
    (_list: string[], step: PixiVNJsonLabelStep) => {
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
    },
    {
        name: "pause",
        description: "Clears the current dialogue and waits for user input before advancing.",
        validation: z.tuple([z.literal("pause")]),
    },
);

// # continue  →  force the step to auto-advance
HashtagCommands.addMapper(
    (_list: string[], step: PixiVNJsonLabelStep) => {
        step.goNextStep = true;
        step.glueEnabled = false;
        return undefined;
    },
    {
        name: "continue",
        description: "Forces the story to proceed to the next step automatically.",
        validation: z.tuple([z.literal("continue")]),
    },
);

// # pause video <alias>  /  # resume video <alias>
HashtagCommands.addMapper(
    (list) => ({
        type: "video",
        operationType: list[0] as "pause" | "resume",
        alias: list[2],
    }),
    {
        name: "video-pause-resume",
        description: "Pauses or resumes a video canvas element identified by its alias.",
        validation: z.tuple([z.enum(["pause", "resume"]), z.literal("video"), z.string()]),
    },
);

// # load assets <alias...>  /  # lazyload assets <alias...>
// # load bundle <alias...>  /  # lazyload bundle <alias...>
HashtagCommands.addMapper(
    (list) => ({
        type: list[1] as "assets" | "bundle",
        operationType: list[0] as "load" | "lazyload",
        aliases: list.slice(2),
    }),
    {
        name: "assets-bundle-load",
        description: "Loads (eagerly or lazily) a set of asset or bundle aliases.",
        validation: z
            .tuple([z.enum(["load", "lazyload"]), z.enum(["assets", "bundle"])])
            .rest(z.string()),
    },
);

// # pause all sounds  /  # resume all sounds  /  # stop all sounds
HashtagCommands.addMapper(
    (list) => ({
        type: "all",
        operationType: list[0] as "pause" | "resume" | "stop",
    }),
    {
        name: "all-sounds-pause-resume-stop",
        description: "Pauses, resumes, or stops all active sounds at once.",
        validation: z.tuple([
            z.enum(["pause", "resume", "stop"]),
            z.literal("all"),
            z.enum(["sounds", "sound"]),
        ]),
    },
);

// # pause sound <alias>
HashtagCommands.addMapper(
    (list) => ({
        type: "sound",
        operationType: "pause",
        alias: list[2],
    }),
    {
        name: "pause-sound",
        description: "Pauses the sound identified by its alias.",
        validation: z.tuple([z.literal("pause"), z.literal("sound"), z.string()]),
    },
);

// # pause channel <alias>
HashtagCommands.addMapper(
    (list) => ({
        type: "channel",
        operationType: "pause",
        alias: list[2],
    }),
    {
        name: "pause-channel",
        description: "Pauses the audio channel identified by its alias.",
        validation: z.tuple([z.literal("pause"), z.literal("channel"), z.string()]),
    },
);

// # resume sound <alias>
HashtagCommands.addMapper(
    (list) => ({
        type: "sound",
        operationType: "resume",
        alias: list[2],
    }),
    {
        name: "resume-sound",
        description: "Resumes the sound identified by its alias.",
        validation: z.tuple([z.literal("resume"), z.literal("sound"), z.string()]),
    },
);

// # resume channel <alias>
HashtagCommands.addMapper(
    (list) => ({
        type: "channel",
        operationType: "resume",
        alias: list[2],
    }),
    {
        name: "resume-channel",
        description: "Resumes the audio channel identified by its alias.",
        validation: z.tuple([z.literal("resume"), z.literal("channel"), z.string()]),
    },
);

// # request input
HashtagCommands.addMapper(
    (_list) => ({
        type: "input",
        operationType: "request",
    }),
    {
        name: "request-input",
        description: "Requests player input without any additional constraints.",
        validation: z.tuple([z.literal("request"), z.literal("input")]),
    },
);

// # request input <key> <value> [<key> <value> …]
// e.g. # request input type number default 18
HashtagCommands.addMapper(
    (list) => {
        // TODO: PixiVNJsonInputRequest
        const op: PixiVNJsonOperation = {
            type: "input",
            operationType: "request",
        };
        try {
            Object.entries(HashtagCommands.convertListStringToObj(list.slice(2))).forEach(
                ([key, value]) => {
                    op[key as keyof PixiVNJsonOperation] = value;
                },
            );
        } catch (_) {}
        return op;
    },
    {
        name: "request-input-params",
        description:
            "Requests player input with optional key/value parameters (e.g. type, default).",
        validation: z
            .tuple([z.literal("request"), z.literal("input")])
            .rest(z.string())
            .refine((arr) => arr.length > 2 && (arr.length - 2) % 2 === 0),
    },
);
