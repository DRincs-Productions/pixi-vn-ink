import {
    ENTRANCE_TRANSITION_TYPES,
    type EntranceTransitionType,
} from "@drincs/pixi-vn-json/actions";
import type {
    PixiVNJsonAnimatedSpriteEdit,
    PixiVNJsonCanvasAnimatedSpriteShow,
    PixiVNJsonMediaTransiotions,
    PixiVNJsonOperation,
} from "@drincs/pixi-vn-json";
import type { AnimatedSpriteSource } from "@drincs/pixi-vn/canvas";
import JSON5 from "json5";
import z from "zod";
import { TRANSITION_TYPES } from "./canvas-transitions";
import { HashtagCommands } from "./hashtag-commands";

const sourceKeys = ["spritesheet", "animation", "frames", "useFrameDurations"] as const;

const REMOVE_TRANSITIONS_DOC = TRANSITION_TYPES.join("|");
const ENTRANCE_TRANSITIONS_DOC = ENTRANCE_TRANSITION_TYPES.join("|");

/**
 * Splits the tokens after `<verb> asprite <alias>` into the command arguments and the optional
 * `with <transition> [<key> <value> …]` tail.
 */
function splitTransition(tail: string[]): {
    args: string[];
    transitionType?: string;
    transitionProps?: Record<string, unknown>;
} {
    const withIndex = tail.indexOf("with");
    if (withIndex < 0) return { args: [...tail] };
    const transitionType = tail[withIndex + 1];
    if (!transitionType) {
        throw new Error("Animated sprite transition is missing after `with`.");
    }
    const propsList = tail.slice(withIndex + 2);
    return {
        args: tail.slice(0, withIndex),
        transitionType,
        transitionProps:
            propsList.length > 0 ? HashtagCommands.convertListStringToObj(propsList) : undefined,
    };
}

function isEntranceTransition(type: string): type is EntranceTransitionType {
    return ENTRANCE_TRANSITION_TYPES.includes(type as EntranceTransitionType);
}

function isRemoveTransition(type: string): type is PixiVNJsonMediaTransiotions["type"] {
    return TRANSITION_TYPES.includes(type as PixiVNJsonMediaTransiotions["type"]);
}

function buildTransition(
    type: string,
    props: Record<string, unknown> | undefined,
): PixiVNJsonMediaTransiotions {
    return { type, ...(props ? { props } : {}) } as PixiVNJsonMediaTransiotions;
}

/**
 * Parses the `show`/`edit` arguments into the animated sprite source (positional spritesheet,
 * `frames [ … ]` list, and the `spritesheet`/`animation`/`frames`/`useFrameDurations` keys) and
 * the remaining display options.
 */
function parseSourceAndProps(
    args: string[],
    allowPositionalSpritesheet: boolean,
): { source: AnimatedSpriteSource; props: Record<string, unknown> } {
    args = [...args];
    let frames: AnimatedSpriteSource["frames"];
    const framesIndex = args.indexOf("frames");
    if (framesIndex >= 0 && args[framesIndex + 1] === "[") {
        const end = args.indexOf("]", framesIndex + 2);
        if (end < 0) {
            throw new Error("Animated sprite frames list is missing its closing bracket.");
        }
        frames = args
            .slice(framesIndex + 2, end)
            .map((frame) => (frame.startsWith("{") ? JSON5.parse(frame) : frame));
        args.splice(framesIndex, end - framesIndex + 1);
    }
    let sourceAlias: string | undefined;
    if (allowPositionalSpritesheet && args.length % 2 !== 0) sourceAlias = args.shift();
    const props = HashtagCommands.convertListStringToObj(args);
    const source: AnimatedSpriteSource = sourceAlias ? { spritesheet: sourceAlias } : {};
    if (frames !== undefined) source.frames = frames;
    for (const key of sourceKeys) {
        if (key in props) {
            Object.assign(source, { [key]: props[key] });
            delete props[key];
        }
    }
    return { source, props };
}

/**
 * Registers the `asprite` hashtag-command mappers. Each mapper converts the ink syntax into a
 * static `type: "asprite"` {@link PixiVNJsonOperation} at compile time; the operation itself is
 * executed by `@drincs/pixi-vn-json`.
 */
export function registerAnimatedSpriteMappers() {
    HashtagCommands.addMapper(
        (list) => {
            const [, , alias, ...tail] = list;
            const { args, transitionType, transitionProps } = splitTransition(tail);
            if (transitionType && !isEntranceTransition(transitionType)) {
                throw new Error(`Unknown animated sprite entrance transition "${transitionType}".`);
            }
            const { source, props } = parseSourceAndProps(args, true);
            const operation: PixiVNJsonCanvasAnimatedSpriteShow = {
                type: "asprite",
                operationType: "show",
                alias,
                source,
                props: props as PixiVNJsonCanvasAnimatedSpriteShow["props"],
                ...(transitionType
                    ? { transition: buildTransition(transitionType, transitionProps) }
                    : {}),
            };
            return operation as PixiVNJsonOperation;
        },
        {
            name: "Show animated sprite",
            description: `Shows an AnimatedSprite canvas element. The spritesheet defaults to the alias; a positional spritesheet alias or the \`spritesheet\` property selects another one. \`animation\`, \`frames [ … ]\` and \`useFrameDurations\` belong to the source; the other key/value properties configure the component. Available since v1.4.0.

\`\`\`ink
# show asprite <alias> [<spritesheet>] [animation <name>] [frames [ <frame> … ]] [useFrameDurations true|false] [<key> <value> …] [with ${ENTRANCE_TRANSITIONS_DOC} [<key> <value> …]]
\`\`\``,
            validation: z
                .tuple([z.literal("show"), z.literal("asprite"), z.string()])
                .rest(z.string()),
        },
    );

    HashtagCommands.addMapper(
        (list) => {
            const [, , alias, ...tail] = list;
            const { args, transitionType } = splitTransition(tail);
            if (transitionType) {
                throw new Error('Animated sprite command "edit" does not support transitions.');
            }
            const { source, props } = parseSourceAndProps(args, false);
            const operation: PixiVNJsonOperation = {
                type: "asprite",
                operationType: "edit",
                alias,
                props: {
                    ...props,
                    ...(Object.keys(source).length > 0 ? { source } : {}),
                } as PixiVNJsonAnimatedSpriteEdit["props"],
            };
            return operation;
        },
        {
            name: "Edit animated sprite",
            description: `Edits the properties of an AnimatedSprite canvas element. Editing source properties (\`spritesheet\`, \`animation\`, \`frames\`, \`useFrameDurations\`) reloads its frames. Available since v1.4.0.

\`\`\`ink
# edit asprite <alias> [<key> <value> …]
\`\`\``,
            validation: z
                .tuple([z.literal("edit"), z.literal("asprite"), z.string()])
                .rest(z.string()),
        },
    );

    HashtagCommands.addMapper(
        (list) => {
            const [, , alias, ...tail] = list;
            const { args, transitionType, transitionProps } = splitTransition(tail);
            if (args.length > 0) {
                throw new Error(`Unexpected animated sprite remove arguments: ${args.join(" ")}.`);
            }
            if (transitionType && !isRemoveTransition(transitionType)) {
                throw new Error(`Unknown animated sprite removal transition "${transitionType}".`);
            }
            const operation: PixiVNJsonOperation = {
                type: "asprite",
                operationType: "remove",
                alias,
                ...(transitionType
                    ? { transition: buildTransition(transitionType, transitionProps) }
                    : {}),
            };
            return operation;
        },
        {
            name: "Remove animated sprite",
            description: `Removes an AnimatedSprite canvas element with an optional transition effect. Available since v1.4.0.

\`\`\`ink
# remove asprite <alias> [with ${REMOVE_TRANSITIONS_DOC} [<key> <value> …]]
\`\`\``,
            validation: z
                .tuple([z.literal("remove"), z.literal("asprite"), z.string()])
                .rest(z.string()),
        },
    );

    HashtagCommands.addMapper(
        (list) => {
            const [operationType, , alias, ...extra] = list;
            if (extra.length > 0) {
                throw new Error(
                    `Unexpected animated sprite ${operationType} arguments: ${extra.join(" ")}.`,
                );
            }
            return {
                type: "asprite",
                operationType: operationType as "pause" | "resume",
                alias,
            };
        },
        {
            name: "Pause/Resume animated sprite",
            description: `Pauses or resumes an AnimatedSprite canvas element. Available since v1.4.0.

\`\`\`ink
# pause asprite <alias>
# resume asprite <alias>
\`\`\``,
            validation: z
                .tuple([z.enum(["pause", "resume"]), z.literal("asprite"), z.string()])
                .rest(z.string()),
        },
    );

    HashtagCommands.addMapper(
        (list) => {
            const [, , alias, frameArg, ...extra] = list;
            if (extra.length > 0) {
                throw new Error(`Unexpected animated sprite goto arguments: ${extra.join(" ")}.`);
            }
            const frame = frameArg ? Number(frameArg) : Number.NaN;
            if (!Number.isInteger(frame) || frame < 0) {
                throw new Error(`Invalid animated sprite frame index "${frameArg ?? ""}".`);
            }
            return {
                type: "asprite",
                operationType: "goto",
                alias,
                frame,
            };
        },
        {
            name: "Go to animated sprite frame",
            description: `Moves an AnimatedSprite canvas element to a zero-based frame index, preserving its playing state. Available since v1.4.0.

\`\`\`ink
# goto asprite <alias> <frame>
\`\`\``,
            validation: z
                .tuple([z.literal("goto"), z.literal("asprite"), z.string()])
                .rest(z.string()),
        },
    );
}
