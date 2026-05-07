import { expect, test } from "vitest";
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