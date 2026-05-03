import { convertInkToJson } from "@/loader";
import { PIXIVNJSON_SCHEMA_URL, type PixiVNJson } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";

test("Function 1", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "max",
                value: 3,
            },
        ],
        labels: {
            main: [
                {
                    dialogue: "You walk through the forest.",
                },
                {
                    labelToOpen: {
                        label: "random_event",
                        type: "call",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
                {
                    dialogue: "You continue your journey.",
                },
                {
                    end: "game_end",
                },
            ],
            random_event: [
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: "==",
                            rightValue: 1,
                            leftValue: {
                                type: "arithmetic",
                                operator: "+",
                                rightValue: 3,
                                leftValue: {
                                    type: "arithmetic",
                                    operator: "+",
                                    rightValue: {
                                        type: "function",
                                        functionName: "test",
                                        args: [0],
                                    },
                                    leftValue: {
                                        type: "arithmetic",
                                        operator: "+",
                                        rightValue: 1,
                                        leftValue: {
                                            type: "arithmetic",
                                            operator: "+",
                                            rightValue: {
                                                type: "function",
                                                functionName: "random_event_value",
                                                args: [
                                                    {
                                                        type: "value",
                                                        storageOperationType: "get",
                                                        storageType: "storage",
                                                        key: "max",
                                                    },
                                                    {
                                                        type: "arithmetic",
                                                        operator: "+",
                                                        rightValue: 0,
                                                        leftValue: 0,
                                                    },
                                                ],
                                            },
                                            leftValue: 2,
                                        },
                                    },
                                },
                            },
                        },
                        then: {
                            dialogue: "You encounter an animal.",
                        },
                        else: {
                            conditionalStep: {
                                type: "ifelse",
                                condition: 2,
                                then: {
                                    dialogue: "You find a coin.",
                                },
                                else: {
                                    dialogue: "Nothing happens.",
                                },
                            },
                        },
                    },
                },
            ],
        },
    };
    const res = convertInkToJson(`
VAR max = 3

-> main
=== main ===
You walk through the forest.
-> random_event ->
You continue your journey.
-> END

=== random_event ===
{2 + random_event_value(0 + 0, max) + 1 + test(0) + 3:
    - 1: You encounter an animal.
    - 2: You find a coin.
    - else: Nothing happens.
}
->->
`);
    expect(res).toEqual(expected);
});

test("Function 2", async () => {
    const res = convertInkToJson(`
=== main ===
Hello
~ test(0)
~ test(1, 2, 3)
-> END
`);
    expect(res).toEqual(undefined);
});

test("Function 3", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {},
    };
    const res = convertInkToJson(`
=== main ===
Hello
~ test(0, 1, 2)
~ test(1, 2, 3)
-> END
`);
    expect(res).toEqual(expected);
});
