import type { PixiVNJson } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";
import { convertInkToJson } from "../src/functions";

test("Function 1", async () => {
    const expected: PixiVNJson = {
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
                        condition: 1,
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
