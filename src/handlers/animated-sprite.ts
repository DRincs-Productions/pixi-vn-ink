import {
    AnimatedSprite,
    canvas,
    showAnimatedSprite,
    type AnimatedSpriteSource,
    type AnimatedSpriteOptions,
} from "@drincs/pixi-vn/canvas";
import {
    canvasElementOperation,
    executeEntranceTransition,
    ENTRANCE_TRANSITION_TYPES,
    type EntranceTransitionType,
} from "@drincs/pixi-vn-json/actions";
import type { PixiVNJsonMediaTransiotions } from "@drincs/pixi-vn-json";
import { HashtagCommands } from "./hashtag-commands";
import { TRANSITION_TYPES } from "./canvas-transitions";
import JSON5 from "json5";

const sourceKeys = ["spritesheet", "animation", "frames", "useFrameDurations"] as const;

export function registerAnimatedSpriteCommands() {
    HashtagCommands.add(
        async (tokens, _props, convert) => {
            const [verb, , alias, ...tail] = tokens;
            const withIndex = tail.indexOf("with");
            const args = withIndex < 0 ? [...tail] : tail.slice(0, withIndex);
            const transition = withIndex < 0 ? undefined : tail[withIndex + 1];
            const transitionProps = withIndex < 0 ? undefined : convert(tail.slice(withIndex + 2));
            if (transition) {
                if (
                    verb === "show" &&
                    !ENTRANCE_TRANSITION_TYPES.includes(transition as EntranceTransitionType)
                ) {
                    throw new Error(`Unknown animated sprite entrance transition "${transition}".`);
                }
                if (
                    verb === "remove" &&
                    !TRANSITION_TYPES.includes(transition as PixiVNJsonMediaTransiotions["type"])
                ) {
                    throw new Error(`Unknown animated sprite removal transition "${transition}".`);
                }
                if (verb !== "show" && verb !== "remove") {
                    throw new Error(
                        `Animated sprite command "${verb}" does not support transitions.`,
                    );
                }
            }
            if (verb === "remove") {
                await canvasElementOperation({
                    type: "canvaselement",
                    operationType: "remove",
                    alias,
                    ...(transition
                        ? {
                              transition: {
                                  type: transition as PixiVNJsonMediaTransiotions["type"],
                                  props: transitionProps,
                              } as PixiVNJsonMediaTransiotions,
                          }
                        : {}),
                });
                return true;
            }
            if (verb === "show" || verb === "edit") {
                let sourceAlias: string | undefined;
                let frames: AnimatedSpriteSource["frames"];
                const framesIndex = args.indexOf("frames");
                if (framesIndex >= 0 && args[framesIndex + 1] === "[") {
                    const end = args.indexOf("]", framesIndex + 2);
                    if (end < 0)
                        throw new Error(
                            "Animated sprite frames list is missing its closing bracket.",
                        );
                    frames = args
                        .slice(framesIndex + 2, end)
                        .map((frame) => (frame.startsWith("{") ? JSON5.parse(frame) : frame));
                    args.splice(framesIndex, end - framesIndex + 1);
                }
                if (verb === "show" && args.length % 2 !== 0) sourceAlias = args.shift();
                const values = convert(args) as Record<string, unknown>;
                const source: AnimatedSpriteSource = sourceAlias
                    ? { spritesheet: sourceAlias }
                    : {};
                if (frames) source.frames = frames;
                for (const key of sourceKeys) {
                    if (key in values) {
                        Object.assign(source, { [key]: values[key] });
                        delete values[key];
                    }
                }
                if (verb === "show") {
                    const component = await showAnimatedSprite(
                        alias,
                        source,
                        values as AnimatedSpriteOptions,
                    );
                    if (transition)
                        await executeEntranceTransition(
                            alias,
                            component,
                            transition as EntranceTransitionType,
                            transitionProps,
                        );
                } else {
                    const component = canvas.find<AnimatedSprite>(alias);
                    if (!(component instanceof AnimatedSprite))
                        throw new Error(`Animated sprite "${alias}" was not found.`);
                    Object.assign(component, values);
                    if (Object.keys(source).length) {
                        component.source = { ...component.source, ...source };
                        await component.load();
                    }
                }
                return true;
            }
            const component = canvas.find<AnimatedSprite>(alias);
            if (!(component instanceof AnimatedSprite))
                throw new Error(`Animated sprite "${alias}" was not found.`);
            if (verb === "pause") component.stop();
            if (verb === "resume") component.play();
            if (verb === "goto") {
                const frame = Number(args[0]);
                if (!Number.isInteger(frame) || frame < 0)
                    throw new Error("Animated sprite frame must be a non-negative integer.");
                component.setFrame(frame);
            }
            return true;
        },
        {
            name: "Animated sprite",
            description:
                "Show, edit, remove, pause, resume, or select a frame of an AnimatedSprite with asprite commands. Available since v1.4.0.",
            validation: /^(show|edit|remove|pause|resume|goto) asprite \S+/,
        },
    );
}
