import { convertInkToJson, convertJsonToInk } from "@/converter";
import { PIXIVNJSON_SCHEMA_URL, type PixiVNJson } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";
import { expectJsonInkRoundTrip } from "./json-to-ink-utils";

test("converts labels, dialogue, choices, diverts, and endings to Ink", () => {
    const input: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                { dialogue: "Hello, world!" },
                {
                    choices: [
                        {
                            text: "Continue",
                            label: "next",
                            type: "call",
                            props: {},
                            oneTime: true,
                        },
                    ],
                },
            ],
            next: [{ dialogue: "Done." }, { end: "game_end" }],
        },
    };

    const ink = convertJsonToInk(input);

    expect(ink).toContain("=== start ===");
    expect(ink).toContain("* [Continue] -> next");
    expect(ink).toContain("-> END");
    const output = convertInkToJson(ink);
    expect(output?.labels?.start?.[0]).toEqual(input.labels?.start?.[0]);
    expect(output?.labels?.start?.[1]?.choices?.[0]).toMatchObject({
        text: "Continue",
        type: "call",
        oneTime: true,
    });
    expect(output?.labels?.next?.[0]).toEqual(input.labels?.next?.[0]);
    expect(output?.labels?.next?.[1]).toEqual({ end: "game_end" });
    expect(output?.labels?.["start_|_c-0"]?.[0]?.labelToOpen).toMatchObject({
        label: "next",
        type: "jump",
    });
});

test("converts initial variables", () => {
    const input: PixiVNJson = {
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "score",
                value: 0,
            },
        ],
        labels: { start: [{ dialogue: "Ready?" }, { end: "label_end" }] },
    };
    const ink = convertJsonToInk(input);
    expect(ink).toContain("VAR score = 0");
    expect(convertInkToJson(ink)).toEqual({
        $schema: PIXIVNJSON_SCHEMA_URL,
        initialOperations: input.initialOperations,
        labels: {
            start: [{ dialogue: "Ready?" }, { end: "label_end", goNextStep: true }],
        },
    });
});

test("reports JSON constructs that have no supported Ink representation", () => {
    const input: PixiVNJson = {
        labels: {
            start: [
                {
                    operations: [
                        {
                            type: "image",
                            operationType: "show",
                            alias: "background",
                            url: "bg.png",
                        },
                    ],
                },
            ],
        },
    };
    expect(() => convertJsonToInk(input)).toThrow(
        "Unsupported operation at labels.start[0].operations[0]",
    );
});

test("round-trips sibling stitches under a single knot", () => {
    const input: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            "station_|_platform": [{ dialogue: "On the platform." }, { end: "game_end" }],
            "station_|_ticket_office": [{ dialogue: "At the ticket office." }, { end: "game_end" }],
            station: [{ dialogue: "At the station." }, { end: "game_end" }],
        },
    };

    const ink = convertJsonToInk(input);
    expect(ink.match(/=== station ===/g)).toHaveLength(1);
    expectJsonInkRoundTrip(input);
});

test("reports a generated choice body with no matching choice", () => {
    const input: PixiVNJson = {
        labels: {
            start: [{ end: "game_end" }],
            "start_|_c-0": [{ dialogue: "Unreferenced." }],
        },
    };

    expect(() => convertJsonToInk(input)).toThrow(
        "Unreferenced generated choice body at labels.start_|_c-0",
    );
});

test("round-trips a deferred tag with a quoted argument", () => {
    const input: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    goNextStep: true,
                    operations: [{ type: "operationtoconvert", values: ['custom_tag "two words"'] }],
                },
                { dialogue: "Ready." },
                { end: "game_end" },
            ],
        },
    };

    expectJsonInkRoundTrip(input);
});

test("round-trips a stored divert target", () => {
    const input: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "destination",
                value: "finish",
            },
        ],
        labels: {
            start: [
                {
                    labelToOpen: {
                        type: "jump",
                        label: {
                            type: "value",
                            storageOperationType: "get",
                            storageType: "storage",
                            key: "destination",
                        },
                    },
                },
            ],
            finish: [{ end: "game_end" }],
        },
    };

    expectJsonInkRoundTrip(input);
});

test("reports the missing member of an Ink list declaration", () => {
    const input: PixiVNJson = {
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "rank",
                value: [1, 3],
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "rank.recruit",
                value: 1,
            },
        ],
    };

    expect(() => convertJsonToInk(input)).toThrow(
        "Missing or invalid Ink list member at initialOperations[2]",
    );
});

test("round-trips a cycle of inline alternatives", () => {
    const input: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    conditionalStep: {
                        type: "stepswitch",
                        choiceType: "loop",
                        elements: [{ dialogue: "Red." }, { dialogue: "Blue." }],
                    },
                },
                { end: "game_end" },
            ],
        },
    };
    expectJsonInkRoundTrip(input);
});
