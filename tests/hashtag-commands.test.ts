import { expect, test } from "vitest";
import type { PixiVNJsonLabelStep } from "@drincs/pixi-vn-json";
import { HashtagCommands } from "../src/handlers/hashtag-commands";

test("mergeJsonBlocks merges sibling JSON-like blocks", () => {
    expect(
        HashtagCommands.mergeJsonBlocks([
            "position",
            "{",
            "x:",
            "1",
            "}",
            "anchor",
            "{",
            "y:",
            "2",
            "}",
        ]),
    ).toEqual(["position", "{ x: 1 }", "anchor", "{ y: 2 }"]);
});

test("mergeJsonBlocks merges nested valid blocks", () => {
    expect(
        HashtagCommands.mergeJsonBlocks([
            "{",
            "x:",
            "1,",
            "nested:",
            "{",
            "y:",
            "2",
            "}",
            "}",
        ]),
    ).toEqual(["{ x: 1, nested: { y: 2 } }"]);
});

test("mergeJsonBlocks keeps an invalid parent split while preserving valid children", () => {
    expect(
        HashtagCommands.mergeJsonBlocks([
            "{",
            "x:",
            "1",
            "nested:",
            "{",
            "y:",
            "2",
            "}",
            "}",
        ]),
    ).toEqual(["{", "x:", "1", "nested:", "{ y: 2 }", "}"]);
});

test("convertTagTolist uses mergeJsonBlocks for repeated JSON-like props", () => {
    expect(
        HashtagCommands.convertTagTolist(
            'edit image bg position { x: 1 } anchor { y: 2 } visible true',
        ),
    ).toEqual([
        "edit",
        "image",
        "bg",
        "position",
        "{ x: 1 }",
        "anchor",
        "{ y: 2 }",
        "visible",
        "true",
    ]);
});

test("convertOperation maps shake with even key/value params", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(HashtagCommands.convertOperation(["shake", "bg", "x", "10", "y", "20"], step)).toEqual({
        alias: "bg",
        type: "shake",
        props: { x: 10, y: 20 },
    });
});

test("convertOperation maps shake with no params", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(HashtagCommands.convertOperation(["shake", "bg"], step)).toEqual({
        alias: "bg",
        type: "shake",
        props: {},
    });
});

test("convertOperation maps shake with quoted-string alias", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(HashtagCommands.convertOperation(["shake", "my bg"], step)).toEqual({
        alias: "my bg",
        type: "shake",
        props: {},
    });
});

test("convertOperation maps shake with string and boolean values", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(
        HashtagCommands.convertOperation(["shake", "bg", "intensity", "high", "enabled", "true"], step),
    ).toEqual({
        alias: "bg",
        type: "shake",
        props: { intensity: "high", enabled: true },
    });
});

test("convertOperation rejects shake with odd params", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(HashtagCommands.convertOperation(["shake", "bg", "x"], step)).toBeUndefined();
});

test("convertOperation maps animate with keyframes and options key/value params", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(
        HashtagCommands.convertOperation(
            ["animate", "bg", "x", "100", "y", "200", "options", "duration", "3"],
            step,
        ),
    ).toEqual({
        alias: "bg",
        type: "animate",
        keyframes: { x: 100, y: 200 },
        options: { duration: 3 },
    });
});

test("convertOperation maps animate with no params", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(HashtagCommands.convertOperation(["animate", "bg"], step)).toEqual({
        alias: "bg",
        type: "animate",
        keyframes: {},
        options: {},
    });
});

test("convertOperation maps animate with only keyframes, no options section", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(HashtagCommands.convertOperation(["animate", "bg", "angle", "90"], step)).toEqual({
        alias: "bg",
        type: "animate",
        keyframes: { angle: 90 },
        options: {},
    });
});

test("convertOperation maps animate with empty keyframes and options keyword", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(HashtagCommands.convertOperation(["animate", "bg", "options", "duration", "3"], step)).toEqual({
        alias: "bg",
        type: "animate",
        keyframes: {},
        options: { duration: 3 },
    });
});

test("convertOperation rejects animate with duplicate options keyword", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(
        HashtagCommands.convertOperation(
            ["animate", "bg", "x", "100", "options", "duration", "3", "options", "easing", "linear"],
            step,
        ),
    ).toBeUndefined();
});

test("convertOperation rejects animate with odd keyframes or options params", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(HashtagCommands.convertOperation(["animate", "bg", "x"], step)).toBeUndefined();
    expect(
        HashtagCommands.convertOperation(
            ["animate", "bg", "x", "100", "options", "duration"],
            step,
        ),
    ).toBeUndefined();
});
