import {
    animatedSpriteOperation,
    ENTRANCE_TRANSITION_TYPES,
    type EntranceTransitionType,
} from "@drincs/pixi-vn-json/actions";
import type {
    PixiVNJsonAnimatedSpriteEdit,
    PixiVNJsonCanvasAnimatedSpriteShow,
    PixiVNJsonMediaTransiotions,
} from "@drincs/pixi-vn-json";
import type { AnimatedSpriteSource } from "@drincs/pixi-vn/canvas";
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
                await animatedSpriteOperation({
                    type: "asprite",
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
                    const operation: PixiVNJsonCanvasAnimatedSpriteShow = {
                        type: "asprite",
                        operationType: "show",
                        alias,
                        source,
                        props: values as PixiVNJsonCanvasAnimatedSpriteShow["props"],
                        ...(transition
                            ? {
                                  transition: {
                                      type: transition as EntranceTransitionType,
                                      props: transitionProps,
                                  } as PixiVNJsonMediaTransiotions,
                              }
                            : {}),
                    };
                    await animatedSpriteOperation(operation);
                } else {
                    const props: PixiVNJsonAnimatedSpriteEdit["props"] = {
                        ...values,
                        ...(Object.keys(source).length > 0 ? { source } : {}),
                    } as PixiVNJsonAnimatedSpriteEdit["props"];
                    await animatedSpriteOperation({
                        type: "asprite",
                        operationType: "edit",
                        alias,
                        props,
                    });
                }
                return true;
            }
            if (verb === "goto") {
                await animatedSpriteOperation({
                    type: "asprite",
                    operationType: "goto",
                    alias,
                    frame: Number(args[0]),
                });
            } else if (verb === "pause" || verb === "resume") {
                await animatedSpriteOperation({ type: "asprite", operationType: verb, alias });
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
