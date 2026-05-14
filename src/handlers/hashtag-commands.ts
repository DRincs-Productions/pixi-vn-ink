import type {
    HashtagHandler,
    HashtagHandlerOptions,
    MapperHandler,
} from "@/handlers/interfaces/HashtagHandler";
import { logger } from "@/utils/log-utility";
import type { StepLabelPropsType } from "@drincs/pixi-vn";
import type {
    PixiVNJsonCanvasAnimate,
    PixiVNJsonLabelStep,
    PixiVNJsonMediaTransiotions,
    PixiVNJsonOperation,
} from "@drincs/pixi-vn-json";
import JSON5 from "json5";
import z, { ZodType } from "zod";

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
     * This function returns an array of all the registered handlers with their configuration. It can be used to get information about the registered handlers, for example, to display a list of available Hashtag-Commands in a debug menu.
     * @returns An array of all the registered handlers with their configuration.
     */
    export function info(): HashtagHandlerOptions[] {
        return [...mapperHandlers.map((h) => h.opts), ...handlers.map((h) => h.opts)];
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
            // if index is odd
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
        // find the { and } that are not between quotes and join only valid JSON-like blocks
        // ["edit","image","bg","position","{",'"x":',"-20.5,",'"y":',"30,",'"test":','"test } \' test",','"test2":','"\'"',"}","visible","true","cursor",'"pointer"',"alpha","0.5",];
        list = mergeJsonBlocks(list);
        list = list.map((item) => {
            if (
                (item.startsWith('"') && item.endsWith('"')) ||
                (item.startsWith("'") && item.endsWith("'")) ||
                (item.startsWith("`") && item.endsWith("`"))
            ) {
                return item.slice(1, -1);
            }
            return item;
        });
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

        logger.error("The operation is not valid", list);
        return undefined;
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
        return convertPropListStringToObj(listParm);
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

    /**
     * Merges valid JSON-like blocks delimited by { }
     * into single strings.
     *
     * Rules:
     * - Braces must be balanced.
     * - Inner blocks are processed before parent blocks.
     * - Every generated block is validated with JSON5.parse().
     * - If a block is invalid:
     *   - the block remains split
     *   - all parent blocks also remain split
     * - Unmatched braces are treated as normal strings.
     */
    export function mergeJsonBlocks(tokens: string[]): string[] {
        return mergeJsonBlockRange(tokens).tokens;
    }

    function mergeJsonBlockRange(tokens: string[]): {
        tokens: string[];
        hasInvalidMatchedBlock: boolean;
    } {
        const result: string[] = [];
        let hasInvalidMatchedBlock = false;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token !== "{") {
                result.push(token);
                continue;
            }

            const currentClose = findMatchingClosingBrace(tokens, i);

            if (currentClose === -1) {
                result.push(token);
                continue;
            }

            const innerBlock = mergeJsonBlockRange(tokens.slice(i + 1, currentClose));
            const blockTokens = ["{", ...innerBlock.tokens, "}"];
            const merged = blockTokens.join(" ");

            if (!innerBlock.hasInvalidMatchedBlock) {
                try {
                    JSON5.parse(merged);
                    result.push(merged);
                    i = currentClose;
                    continue;
                } catch {
                    // keep the block split below
                }
            }

            hasInvalidMatchedBlock = true;
            result.push(...blockTokens);
            i = currentClose;
        }

        return {
            tokens: result,
            hasInvalidMatchedBlock,
        };
    }

    function findMatchingClosingBrace(tokens: string[], openIndex: number): number {
        let depth = 0;

        for (let i = openIndex; i < tokens.length; i++) {
            if (tokens[i] === "{") {
                depth++;
            } else if (tokens[i] === "}") {
                depth--;

                if (depth === 0) {
                    return i;
                }
            }
        }

        return -1;
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
        description: `Calls the label specified by the second token, then returns to the current position.

\`\`\`ink
# call label_name
\`\`\``,
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
        description: `Jumps to the label specified by the second token without returning.

\`\`\`ink
# jump label_name
\`\`\``,
        validation: z.tuple([z.literal("jump"), z.string()]),
    },
);

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
        description: `Clears the current dialogue and waits for user input before advancing.

\`\`\`ink
# pause
\`\`\``,
        validation: z.tuple([z.literal("pause")]),
    },
);

HashtagCommands.addMapper(
    (_list: string[], step: PixiVNJsonLabelStep) => {
        step.goNextStep = true;
        step.glueEnabled = false;
        return undefined;
    },
    {
        name: "continue",
        description: `Forces the story to proceed to the next step automatically.

\`\`\`ink
# continue
\`\`\``,
        validation: z.tuple([z.literal("continue")]),
    },
);

HashtagCommands.addMapper(
    (list) => ({
        type: "video",
        operationType: list[0] as "pause" | "resume",
        alias: list[2],
    }),
    {
        name: "video-pause-resume",
        description: `Pauses or resumes a video canvas element identified by its alias.

\`\`\`ink
# pause video <alias>
# resume video <alias>
\`\`\``,
        validation: z.tuple([z.enum(["pause", "resume"]), z.literal("video"), z.string()]),
    },
);

HashtagCommands.addMapper(
    (list) => ({
        type: list[1] as "assets" | "bundle",
        operationType: list[0] as "load" | "lazyload",
        aliases: list.slice(2),
    }),
    {
        name: "assets-bundle-load",
        description: `Loads (eagerly or lazily) a set of asset or bundle aliases.

\`\`\`ink
# load assets <alias...>
# lazyload assets <alias...>
# load bundle <alias...>
# lazyload bundle <alias...>
\`\`\``,
        validation: z
            .tuple([z.enum(["load", "lazyload"]), z.enum(["assets", "bundle"])])
            .rest(z.string()),
    },
);

HashtagCommands.addMapper(
    (list) => ({
        type: "all",
        operationType: list[0] as "pause" | "resume" | "stop",
    }),
    {
        name: "all-sounds-pause-resume-stop",
        description: `Pauses, resumes, or stops all active sounds at once.

\`\`\`ink
# pause all sounds
# resume all sounds
# stop all sounds
\`\`\``,
        validation: z.tuple([
            z.enum(["pause", "resume", "stop"]),
            z.literal("all"),
            z.enum(["sounds", "sound"]),
        ]),
    },
);

HashtagCommands.addMapper(
    (list) => ({
        type: "sound",
        operationType: "pause",
        alias: list[2],
    }),
    {
        name: "pause-sound",
        description: `Pauses the sound identified by its alias.

\`\`\`ink
# pause sound <alias>
\`\`\``,
        validation: z.tuple([z.literal("pause"), z.literal("sound"), z.string()]),
    },
);

HashtagCommands.addMapper(
    (list) => ({
        type: "channel",
        operationType: "pause",
        alias: list[2],
    }),
    {
        name: "pause-channel",
        description: `Pauses the audio channel identified by its alias.

\`\`\`ink
# pause channel <alias>
\`\`\``,
        validation: z.tuple([z.literal("pause"), z.literal("channel"), z.string()]),
    },
);

HashtagCommands.addMapper(
    (list) => ({
        type: "sound",
        operationType: "resume",
        alias: list[2],
    }),
    {
        name: "resume-sound",
        description: `Resumes the sound identified by its alias.

\`\`\`ink
# resume sound <alias>
\`\`\``,
        validation: z.tuple([z.literal("resume"), z.literal("sound"), z.string()]),
    },
);

HashtagCommands.addMapper(
    (list) => ({
        type: "channel",
        operationType: "resume",
        alias: list[2],
    }),
    {
        name: "resume-channel",
        description: `Resumes the audio channel identified by its alias.

\`\`\`ink
# resume channel <alias>
\`\`\``,
        validation: z.tuple([z.literal("resume"), z.literal("channel"), z.string()]),
    },
);

HashtagCommands.addMapper(
    (list) => ({
        type: "sound",
        operationType: "stop",
        alias: list[2],
    }),
    {
        name: "stop-sound",
        description: `Stops the sound identified by its alias.

\`\`\`ink
# stop sound <alias>
\`\`\``,
        validation: z.tuple([z.literal("stop"), z.literal("sound"), z.string()]),
    },
);

HashtagCommands.addMapper(
    (list) => ({
        type: "sound",
        operationType: "stop",
        alias: list[2],
    }),
    {
        name: "remove-sound",
        description: `Removes (stops) the sound identified by its alias.

\`\`\`ink
# remove sound <alias>
\`\`\``,
        deprecated: true,
        validation: z.tuple([z.literal("remove"), z.literal("sound"), z.string()]),
    },
);

HashtagCommands.addMapper(
    (list) => ({
        type: "sound",
        operationType: "edit",
        alias: list[2],
        props: HashtagCommands.convertListStringToObj(list.slice(3)),
    }),
    {
        name: "edit-sound",
        description: `Edits the properties of a sound identified by its alias.

\`\`\`ink
# edit sound <alias> [<key> <value> …]
\`\`\``,
        validation: z
            .tuple([z.literal("edit"), z.literal("sound"), z.string()])
            .rest(z.string())
            .refine((arr) => (arr.length - 3) % 2 === 0),
    },
);

HashtagCommands.addMapper(
    (list) => {
        const alias = list[2];
        const op: PixiVNJsonOperation = {
            type: "sound",
            operationType: "play",
            alias,
            url: alias,
        };
        if (list.length > 3) {
            op.props = HashtagCommands.convertListStringToObj(list.slice(3));
        }
        return op;
    },
    {
        name: "play-sound",
        description: `Plays a sound using its alias as the URL, with optional key/value properties.

\`\`\`ink
# play sound <alias> [<key> <value> …]
\`\`\``,
        validation: z
            .tuple([z.literal("play"), z.literal("sound"), z.string()])
            .rest(z.string())
            .refine((arr) => (arr.length - 3) % 2 === 0),
    },
);

HashtagCommands.addMapper(
    (list) => {
        const alias = list[2];
        const url = list[3];
        const op: PixiVNJsonOperation = {
            type: "sound",
            operationType: "play",
            alias,
            url,
        };
        if (list.length > 4) {
            op.props = HashtagCommands.convertListStringToObj(list.slice(4));
        }
        return op;
    },
    {
        name: "play-sound-with-source",
        description: `Plays a sound with an explicit source URL and optional key/value properties.
        
\`\`\`ink
# play sound <alias> <source> [<key> <value> …]
\`\`\`
`,
        validation: z
            .tuple([z.literal("play"), z.literal("sound"), z.string()])
            .rest(z.string())
            .refine((arr) => arr.length > 3 && (arr.length - 3) % 2 !== 0),
    },
);
function convertListStringToPropListForMapper(listParm: string[]): string[] {
    const list: string[] = [];
    let curlyBrackets = 0;
    let temp = "";
    for (const item of listParm) {
        if (item.startsWith("{")) {
            curlyBrackets++;
            temp += item;
        } else if (item.endsWith("}") && curlyBrackets > 0) {
            curlyBrackets--;
            temp += item;
            if (curlyBrackets === 0) {
                list.push(temp);
                temp = "";
            }
        } else if (curlyBrackets > 0) {
            temp += item;
        } else {
            list.push(item);
        }
    }
    return list;
}

function getTransitionForMapper(
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
            transition.props = HashtagCommands.convertListStringToObj(propsList);
        } catch (_) {}
    }
    return transition;
}

function getImageOrVideoShowOperationForMapper(
    type: "image" | "video",
    alias: string,
    list: string[],
): PixiVNJsonOperation | undefined {
    let url: string;
    let propList: string[];
    if (list.length % 2 === 0) {
        url = alias;
        propList = list;
    } else {
        url = list[0];
        propList = list.slice(1);
    }
    const op: PixiVNJsonOperation = {
        type,
        operationType: "show",
        alias,
        url,
    };
    if (propList.length > 0) {
        if (propList.includes("with") && propList.length > propList.indexOf("with") + 1) {
            const transitionType = propList[propList.indexOf("with") + 1];
            const transitionList = propList.slice(propList.indexOf("with") + 2);
            propList = propList.slice(0, propList.indexOf("with"));
            const transition = getTransitionForMapper(transitionType, transitionList);
            if (transition !== undefined) {
                op.transition = transition;
            }
        }
        if (propList.length > 0) {
            op.props = HashtagCommands.convertListStringToObj(propList);
        }
    }
    return op;
}

function getTextShowOperationForMapper(
    alias: string,
    list: string[],
): PixiVNJsonOperation | undefined {
    let text: string;
    let propList: string[];
    if (list.length % 2 === 0) {
        text = alias;
        propList = list;
    } else {
        text = list[0];
        propList = list.slice(1);
    }
    const op: PixiVNJsonOperation = {
        type: "text",
        operationType: "show",
        alias,
        text,
    };
    if (propList.length > 0) {
        if (propList.includes("with") && propList.length > propList.indexOf("with") + 1) {
            const transitionType = propList[propList.indexOf("with") + 1];
            const transitionList = propList.slice(propList.indexOf("with") + 2);
            propList = propList.slice(0, propList.indexOf("with"));
            const transition = getTransitionForMapper(transitionType, transitionList);
            if (transition !== undefined) {
                op.transition = transition;
            }
        }
        if (propList.length > 0) {
            op.props = HashtagCommands.convertListStringToObj(propList);
        }
    }
    return op;
}

function getCanvasRemoveOperationForMapper(
    type: "image" | "video" | "canvaselement" | "text" | "imagecontainer",
    alias: string,
    list: string[],
): PixiVNJsonOperation | undefined {
    const op: PixiVNJsonOperation = {
        type,
        operationType: "remove",
        alias,
    };
    if (list.includes("with") && list.length > list.indexOf("with") + 1) {
        const transitionType = list[list.indexOf("with") + 1];
        const transitionList = list.slice(list.indexOf("with") + 2);
        const transition = getTransitionForMapper(transitionType, transitionList);
        if (transition !== undefined) {
            op.transition = transition;
        }
    }
    return op;
}

function getImageContainerShowOperationForMapper(
    alias: string,
    list: string[],
): PixiVNJsonOperation | undefined {
    const removeExtraDoubleQuotesForMapper = (value: string): string => {
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
    };
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
        type: "imagecontainer",
        operationType: "show",
        alias,
        urls: urls.map((item) => removeExtraDoubleQuotesForMapper(item)),
    };
    let propList = list.slice(endIndex + 1);
    if (propList.length > 0) {
        if (propList.includes("with") && propList.length > propList.indexOf("with") + 1) {
            const transitionType = propList[propList.indexOf("with") + 1];
            const transitionList = propList.slice(propList.indexOf("with") + 2);
            propList = propList.slice(0, propList.indexOf("with"));
            const transition = getTransitionForMapper(transitionType, transitionList);
            if (transition !== undefined) {
                op.transition = transition;
            }
        }
        if (propList.length > 0) {
            op.props = HashtagCommands.convertListStringToObj(propList);
        }
    }
    return op;
}

function splitImageContainerShowListForValidation(
    fullList: string[],
): { beforeWith: string[]; afterWith: string[] } | undefined {
    const commandList = fullList.slice(3);
    const startIndex = commandList.findIndex((item) => item.startsWith("["));
    const endIndex = commandList.findIndex((item) => item.endsWith("]"));
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        return undefined;
    }
    const propList = commandList.slice(endIndex + 1);
    const withIndex = propList.indexOf("with");
    if (withIndex === -1) {
        return { beforeWith: propList, afterWith: [] };
    }
    return {
        beforeWith: propList.slice(0, withIndex),
        afterWith: propList.slice(withIndex + 1),
    };
}

HashtagCommands.addMapper(
    (list) => ({
        alias: list[1],
        type: "shake",
        props: HashtagCommands.convertListStringToObj(list.slice(2)),
    }),
    {
        name: "shake-effect",
        description: `Applies shake effect to a canvas alias with optional key/value parameters.

\`\`\`ink
# shake <alias> [<key> <value> …]
\`\`\``,
        validation: z
            .tuple([z.literal("shake"), z.string()])
            .rest(z.string())
            .refine((arr) => (arr.length - 2) % 2 === 0),
    },
);

HashtagCommands.addMapper(
    (list) => {
        const commandList = list.slice(2);
        let keyframesList = commandList;
        let optionsList: string[] = [];
        if (commandList.includes("options")) {
            const optionsIndex = commandList.indexOf("options");
            keyframesList = commandList.slice(0, optionsIndex);
            optionsList = commandList.slice(optionsIndex + 1);
        }
        const animate: PixiVNJsonCanvasAnimate = {
            alias: list[1],
            type: "animate",
            keyframes: HashtagCommands.convertListStringToObj(keyframesList),
            options: HashtagCommands.convertListStringToObj(optionsList),
        };
        return animate;
    },
    {
        name: "animate-effect",
        description: `Animates a canvas alias with keyframes and optional options section, both in key/value pairs.

\`\`\`ink
# animate <alias> [<key> <value> …] [options <key> <value> …]
\`\`\``,
        validation: z
            .tuple([z.literal("animate"), z.string()])
            .rest(z.string())
            .refine((arr) => {
                const commandList = arr.slice(2);
                const optionsIndex = commandList.indexOf("options");
                if (optionsIndex === -1) {
                    return commandList.length % 2 === 0;
                }
                if (commandList.lastIndexOf("options") !== optionsIndex) {
                    return false;
                }
                const keyframesList = commandList.slice(0, optionsIndex);
                const optionsList = commandList.slice(optionsIndex + 1);
                return keyframesList.length % 2 === 0 && optionsList.length % 2 === 0;
            }),
    },
);

HashtagCommands.addMapper(
    (list) => {
        const alias = list[2];
        const propsList = convertListStringToPropListForMapper(list.slice(3));
        return getImageOrVideoShowOperationForMapper("image", alias, propsList);
    },
    {
        name: "show-image",
        description: `Shows an image canvas element with optional source, properties, and transition.

\`\`\`ink
# show image <alias> [<source>] [<key> <value> …] [with <transition> [<key> <value> …]]
\`\`\``,
        validation: z.tuple([z.literal("show"), z.literal("image"), z.string()]).rest(z.string()),
    },
);

HashtagCommands.addMapper(
    (list) =>
        getImageContainerShowOperationForMapper(
            list[2],
            convertListStringToPropListForMapper(list.slice(3)),
        ),
    {
        name: "show-imagecontainer",
        description: `Shows an image-container canvas element with list and optional key/value properties.

\`\`\`ink
# show imagecontainer <alias> [<list>] [<key> <value> …]
\`\`\``,
        validation: z
            .tuple([z.literal("show"), z.literal("imagecontainer"), z.string()])
            .rest(z.string())
            .refine((arr) => {
                const split = splitImageContainerShowListForValidation(arr);
                if (split === undefined) {
                    return false;
                }
                return split.afterWith.length === 0 && split.beforeWith.length % 2 === 0;
            }),
    },
);

HashtagCommands.addMapper(
    (list) =>
        getImageContainerShowOperationForMapper(
            list[2],
            convertListStringToPropListForMapper(list.slice(3)),
        ),
    {
        name: "show-imagecontainer-with-transition",
        description: `Shows an image-container canvas element with list, optional properties, and transition.

\`\`\`ink
# show imagecontainer <alias> [<list>] [<key> <value> …] with <transition>
\`\`\``,
        validation: z
            .tuple([z.literal("show"), z.literal("imagecontainer"), z.string()])
            .rest(z.string())
            .refine((arr) => {
                const split = splitImageContainerShowListForValidation(arr);
                if (split === undefined) {
                    return false;
                }
                return split.afterWith.length === 1 && split.beforeWith.length % 2 === 0;
            }),
    },
);

HashtagCommands.addMapper(
    (list) =>
        getImageContainerShowOperationForMapper(
            list[2],
            convertListStringToPropListForMapper(list.slice(3)),
        ),
    {
        name: "show-imagecontainer-with-transition-props",
        description: `Shows an image-container canvas element with list, optional properties, transition, and transition properties.

\`\`\`ink
# show imagecontainer <alias> [<list>] [<key> <value> …] with <transition> <key> <value> …
\`\`\``,
        validation: z
            .tuple([z.literal("show"), z.literal("imagecontainer"), z.string()])
            .rest(z.string())
            .refine((arr) => {
                const split = splitImageContainerShowListForValidation(arr);
                if (split === undefined) {
                    return false;
                }
                return (
                    split.afterWith.length > 1 &&
                    (split.afterWith.length - 1) % 2 === 0 &&
                    split.beforeWith.length % 2 === 0
                );
            }),
    },
);

HashtagCommands.addMapper(
    (list) => {
        const alias = list[2];
        const propsList = convertListStringToPropListForMapper(list.slice(3));
        return getImageOrVideoShowOperationForMapper("video", alias, propsList);
    },
    {
        name: "show-video",
        description: `Shows a video canvas element with optional source, properties, and transition.

\`\`\`ink
# show video <alias> [<source>] [<key> <value> …] [with <transition> [<key> <value> …]]
\`\`\``,
        validation: z.tuple([z.literal("show"), z.literal("video"), z.string()]).rest(z.string()),
    },
);

HashtagCommands.addMapper(
    (list) => {
        const alias = list[2];
        return getTextShowOperationForMapper(alias, list.slice(3));
    },
    {
        name: "show-text",
        description: `Shows a text canvas element with optional text, properties, and transition.

\`\`\`ink
# show text <alias> [<text>] [<key> <value> …] [with <transition> [<key> <value> …]]
\`\`\``,
        validation: z.tuple([z.literal("show"), z.literal("text"), z.string()]).rest(z.string()),
    },
);

HashtagCommands.addMapper(
    (list) => {
        const alias = list[2];
        const propsList = convertListStringToPropListForMapper(list.slice(3));
        return getCanvasRemoveOperationForMapper("image", alias, propsList);
    },
    {
        name: "remove-image",
        description: `Removes an image canvas element with optional source/properties and transition.

\`\`\`ink
# remove image <alias> [<source>] [<key> <value> …] [with <transition> [<key> <value> …]]
\`\`\``,
        validation: z.tuple([z.literal("remove"), z.literal("image"), z.string()]).rest(z.string()),
    },
);

HashtagCommands.addMapper(
    (list) => {
        const alias = list[2];
        const propsList = convertListStringToPropListForMapper(list.slice(3));
        return getCanvasRemoveOperationForMapper("video", alias, propsList);
    },
    {
        name: "remove-video",
        description: `Removes a video canvas element with optional source/properties and transition.

\`\`\`ink
# remove video <alias> [<source>] [<key> <value> …] [with <transition> [<key> <value> …]]
\`\`\``,
        validation: z.tuple([z.literal("remove"), z.literal("video"), z.string()]).rest(z.string()),
    },
);

HashtagCommands.addMapper(
    (list) => {
        const alias = list[2];
        const propsList = convertListStringToPropListForMapper(list.slice(3));
        return getCanvasRemoveOperationForMapper("canvaselement", alias, propsList);
    },
    {
        name: "remove-canvaselement",
        description: `Removes a canvas element with optional properties and optional transition params.

\`\`\`ink
# remove canvaselement <alias> [<key> <value> …] [with <transition> [<key> <value> …]]
\`\`\``,
        validation: z
            .tuple([z.literal("remove"), z.literal("canvaselement"), z.string()])
            .rest(z.string()),
    },
);

HashtagCommands.addMapper(
    (list) => {
        const alias = list[2];
        const propsList = convertListStringToPropListForMapper(list.slice(3));
        return getCanvasRemoveOperationForMapper("text", alias, propsList);
    },
    {
        name: "remove-text",
        description: `Removes a text canvas element with optional properties and transition.

\`\`\`ink
# remove text <alias> [<key> <value> …] [with <transition> [<key> <value> …]]
\`\`\``,
        validation: z.tuple([z.literal("remove"), z.literal("text"), z.string()]).rest(z.string()),
    },
);

HashtagCommands.addMapper(
    (list) => {
        const alias = list[2];
        const propsList = convertListStringToPropListForMapper(list.slice(3));
        return getCanvasRemoveOperationForMapper("imagecontainer", alias, propsList);
    },
    {
        name: "remove-imagecontainer",
        description: `Removes an image-container canvas element with optional properties and transition.

\`\`\`ink
# remove imagecontainer <alias> [<key> <value> …] [with <transition> [<key> <value> …]]
\`\`\``,
        validation: z
            .tuple([z.literal("remove"), z.literal("imagecontainer"), z.string()])
            .rest(z.string()),
    },
);

HashtagCommands.addMapper(
    (list) => ({
        type: "image",
        operationType: "edit",
        alias: list[2],
        props: HashtagCommands.convertListStringToObj(list.slice(3)),
    }),
    {
        name: "edit-image",
        description: `Edits the properties of an image canvas element identified by its alias.

\`\`\`ink
# edit image <alias> [<key> <value> …]
\`\`\``,
        validation: z.tuple([z.literal("edit"), z.literal("image"), z.string()]).rest(z.string()),
    },
);

HashtagCommands.addMapper(
    (list) => ({
        type: "imagecontainer",
        operationType: "edit",
        alias: list[2],
        props: HashtagCommands.convertListStringToObj(list.slice(3)),
    }),
    {
        name: "edit-imagecontainer",
        description: `Edits the properties of an image-container canvas element identified by its alias.

\`\`\`ink
# edit imagecontainer <alias> [<key> <value> …]
\`\`\``,
        validation: z
            .tuple([z.literal("edit"), z.literal("imagecontainer"), z.string()])
            .rest(z.string()),
    },
);

HashtagCommands.addMapper(
    (list) => ({
        type: "canvaselement",
        operationType: "edit",
        alias: list[2],
        props: HashtagCommands.convertListStringToObj(list.slice(3)),
    }),
    {
        name: "edit-canvaselement",
        description: `Edits the properties of a canvas element identified by its alias.

\`\`\`ink
# edit canvaselement <alias> [<key> <value> …]
\`\`\``,
        validation: z
            .tuple([z.literal("edit"), z.literal("canvaselement"), z.string()])
            .rest(z.string()),
    },
);

HashtagCommands.addMapper(
    (list) => ({
        type: "video",
        operationType: "edit",
        alias: list[2],
        props: HashtagCommands.convertListStringToObj(list.slice(3)),
    }),
    {
        name: "edit-video",
        description: `Edits the properties of a video canvas element identified by its alias.

\`\`\`ink
# edit video <alias> [<key> <value> …]
\`\`\``,
        validation: z.tuple([z.literal("edit"), z.literal("video"), z.string()]).rest(z.string()),
    },
);

HashtagCommands.addMapper(
    (list) => ({
        type: "text",
        operationType: "edit",
        alias: list[2],
        props: HashtagCommands.convertListStringToObj(list.slice(3)),
    }),
    {
        name: "edit-text",
        description: `Edits the properties of a text canvas element identified by its alias.

\`\`\`ink
# edit text <alias> [<key> <value> …]
\`\`\``,
        validation: z.tuple([z.literal("edit"), z.literal("text"), z.string()]).rest(z.string()),
    },
);

HashtagCommands.addMapper(
    (_list) => ({
        type: "input",
        operationType: "request",
    }),
    {
        name: "request-input",
        description: `Requests player input without any additional constraints.

\`\`\`ink
# request input
\`\`\``,
        validation: z.tuple([z.literal("request"), z.literal("input")]),
    },
);

HashtagCommands.addMapper(
    (list) => {
        const op: PixiVNJsonOperation = {
            type: "input",
            operationType: "request",
        };
        try {
            const props = HashtagCommands.convertListStringToObj(list.slice(2)) as Record<
                string,
                unknown
            >;
            if ("type" in props && typeof props.type === "string") {
                op.valueType = props.type;
            }
            if ("default" in props) {
                op.defaultValue = props.default;
            }
        } catch (_) {}
        return op;
    },
    {
        name: "request-input-params",
        description: `Requests player input with optional key/value parameters (e.g. type, default).

\`\`\`ink
# request input <key> <value> [<key> <value> …]
# request input type number default 18
\`\`\``,
        validation: z
            .tuple([z.literal("request"), z.literal("input")])
            .rest(z.string())
            .refine((arr) => arr.length > 2 && (arr.length - 2) % 2 === 0),
    },
);
