import { convertInkText } from "@/loader";
import { PIXIVNJSON_SCHEMA_URL, type PixiVNJson } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";
import { convertOperation } from "./convertOperation";

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#diverts-are-invisible
 */
test("Diverts are invisible", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            hurry_home: [
                {
                    dialogue: "We hurried home to Savile Row ",
                    goNextStep: true,
                },
                {
                    labelToOpen: {
                        label: "as_fast_as_we_could",
                        type: "jump",
                    },
                    glueEnabled: true,
                },
            ],
            as_fast_as_we_could: [
                {
                    dialogue: "as fast as we could.",
                },
            ],
        },
    };
    const res = convertInkText(`
-> hurry_home
=== hurry_home ===
We hurried home to Savile Row -> as_fast_as_we_could

=== as_fast_as_we_could ===
as fast as we could.
`);
    expect(res).toEqual(expected);
});

/**
 * A divert on its own line is an intentional pause point: the user must click
 * before it fires (unlike a divert glued to the end of the previous line, which
 * fires immediately). But a label/stitch that opens with a bare `<>` must not add
 * an extra, content-free click of its own before its glued text appears, however
 * it was reached.
 */
test("Diverts and glue at the start of a label", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            "theTop_|_extendSentence": [
                {
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " append this.",
                },
                {
                    dialogue: "But with the divert on the same line it takes one click to ",
                    goNextStep: true,
                },
                {
                    labelToOpen: {
                        label: "theTop_|_extendSentence2",
                        type: "jump",
                        params: undefined,
                    },
                    glueEnabled: true,
                },
            ],
            "theTop_|_extendSentence2": [
                {
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " append this.",
                },
                {
                    dialogue: "I thought that putting <> at the front of a line would mean it would take a click to advance a step to",
                    glueEnabled: true,
                    goNextStep: false,
                },
                {
                    dialogue: " append this. But, it doesn't wait...",
                },
                {
                    end: "game_end",
                },
            ],
            theTop: [
                {
                    dialogue: "With the divert on a second line, it takes two clicks to",
                },
                {
                    labelToOpen: {
                        label: "theTop_|_extendSentence",
                        type: "jump",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
        },
    };
    const res = convertInkText(`
=== theTop ===
With the divert on a second line, it takes two clicks to
->extendSentence
= extendSentence
<> append this.
//the divert does not execute until the user clicks a second time

But with the divert on the same line it takes one click to->extendSentence2
= extendSentence2
<> append this.
//the divert executes after the user clicks once

I thought that putting \\<\\> at the front of a line would mean it would take a click to advance a step to
<> append this. But, it doesn't wait...
//the two lines are executed without user interaction
-> END
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#glue
 */
test("Glue", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            hurry_home: [
                {
                    dialogue: "We hurried home ",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    labelToOpen: {
                        label: "to_savile_row",
                        type: "jump",
                    },
                    glueEnabled: undefined,
                },
            ],
            to_savile_row: [
                {
                    dialogue: "to Savile Row",
                },
                {
                    labelToOpen: {
                        label: "as_fast_as_we_could",
                        type: "jump",
                    },
                    glueEnabled: undefined,
                },
            ],
            as_fast_as_we_could: [
                {
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " as fast as we could.",
                },
            ],
        },
    };
    const res = convertInkText(`
=== hurry_home ===
We hurried home <>
-> to_savile_row

=== to_savile_row ===
to Savile Row
-> as_fast_as_we_could

=== as_fast_as_we_could ===
<> as fast as we could.
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#branching-and-joining
 */
test("Branching and joining", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            "back_in_london_|_c-0": [
                {
                    dialogue: '"There is not a moment to lose!"',
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " I declared.",
                },
                {
                    labelToOpen: {
                        label: "hurry_outside",
                        type: "jump",
                    },
                    glueEnabled: undefined,
                },
            ],
            "back_in_london_|_c-1": [
                {
                    dialogue: '"Monsieur, let us savour this moment!"',
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " I declared.",
                },
                {
                    dialogue:
                        "My master clouted me firmly around the head and dragged me out of the door.",
                },
                {
                    labelToOpen: {
                        label: "dragged_outside",
                        type: "jump",
                    },
                    glueEnabled: undefined,
                },
            ],
            "back_in_london_|_c-2": [
                {
                    labelToOpen: {
                        label: "hurry_outside",
                        type: "jump",
                    },
                    glueEnabled: undefined,
                },
            ],
            back_in_london: [
                {
                    dialogue: "We arrived into London at 9.45pm exactly.",
                },
                {
                    choices: [
                        {
                            text: '"There is not a moment to lose!"',
                            label: "back_in_london_|_c-0",
                            oneTime: true,
                            props: {},
                            type: "call",
                        },
                        {
                            text: '"Monsieur, let us savour this moment!"',
                            label: "back_in_london_|_c-1",
                            oneTime: true,
                            props: {},
                            type: "call",
                        },
                        {
                            text: "We hurried home",
                            label: "back_in_london_|_c-2",
                            oneTime: true,
                            props: {},
                            type: "call",
                        },
                    ],
                },
            ],
            hurry_outside: [
                {
                    dialogue: "We hurried home to Savile Row ",
                    goNextStep: true,
                },
                {
                    labelToOpen: {
                        label: "as_fast_as_we_could",
                        type: "jump",
                    },
                    glueEnabled: true,
                },
            ],
            dragged_outside: [
                {
                    dialogue: "He insisted that we hurried home to Savile Row",
                },
                {
                    labelToOpen: {
                        label: "as_fast_as_we_could",
                        type: "jump",
                    },
                    glueEnabled: undefined,
                },
            ],
            as_fast_as_we_could: [
                {
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " as fast as we could.",
                },
            ],
        },
    };
    const res = convertInkText(`
=== back_in_london ===

We arrived into London at 9.45pm exactly.

*	"There is not a moment to lose!"[] I declared.
	-> hurry_outside

*	"Monsieur, let us savour this moment!"[] I declared.
	My master clouted me firmly around the head and dragged me out of the door.
	-> dragged_outside

*	[We hurried home] -> hurry_outside


=== hurry_outside ===
We hurried home to Savile Row -> as_fast_as_we_could


=== dragged_outside ===
He insisted that we hurried home to Savile Row
-> as_fast_as_we_could


=== as_fast_as_we_could ===
<> as fast as we could.
`);
    expect(res).toEqual(expected);
});

test("Fix glue error", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        initialOperations: [
            {
                key: "some_var",
                storageOperationType: "set",
                storageType: "storage",
                type: "value",
                value: false,
            },
        ],
        labels: {
            "start_|_c-0": [
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "some_var",
                            value: true,
                        },
                    ],
                },
                {
                    labelToOpen: {
                        label: "finish",
                        type: "jump",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_c-1": [
                {
                    labelToOpen: {
                        label: "finish",
                        type: "jump",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            start: [
                {
                    dialogue: "some text",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    operations: [],
                    goNextStep: true,
                    glueEnabled: false,
                },
                {
                    choices: [
                        {
                            text: "1_5_card1",
                            label: "start_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "1_5_card2",
                            label: "start_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            finish: [
                {
                    dialogue: "finish text",
                },
                {
                    end: "game_end",
                },
            ],
        },
    };
    const res = convertInkText(`
VAR some_var = false

=== start ===
some text<># continue
    * [1_5_card1]
        ~ some_var = true
        -> finish

    * [1_5_card2]
        -> finish

=== finish ===
finish text
-> END
`);
    await convertOperation(res);
    expect(res).toEqual(expected);
});

/**
 * A label/stitch opening with a bare `<>` has no previous step in its own list to
 * glue onto, so a placeholder step is created. That placeholder must auto-continue
 * (no extra click) regardless of whether the label was reached via a divert on its
 * own line (which itself is still an intentional pause) or a divert glued to the
 * end of the previous line (no pause at all).
 */
test("Glue at the start of a label is invisible, whichever divert reaches it", async () => {
    const expectedNewLine: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                { dialogue: "Ready?" },
                {
                    labelToOpen: {
                        label: "next",
                        type: "jump",
                    },
                },
            ],
            next: [
                {
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " Go!",
                },
            ],
        },
    };
    const resNewLine = convertInkText(`
=== start ===
Ready?
-> next

=== next ===
<> Go!
`);
    expect(resNewLine).toEqual(expectedNewLine);

    const expectedSameLine: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    dialogue: "Ready? ",
                    goNextStep: true,
                },
                {
                    labelToOpen: {
                        label: "next",
                        type: "jump",
                    },
                    glueEnabled: true,
                },
            ],
            next: [
                {
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " Go!",
                },
            ],
        },
    };
    const resSameLine = convertInkText(`
=== start ===
Ready?-> next

=== next ===
<> Go!
`);
    expect(resSameLine).toEqual(expectedSameLine);
});

/**
 * <> glued to the end of a line means "don't wait, continue right away": the two
 * lines merge into a single click with no pause in between.
 */
test("Glue at the end of a line skips the click before the next line", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    dialogue: "Hello ",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "world.",
                },
                {
                    end: "game_end",
                },
            ],
        },
    };
    const res = convertInkText(`
=== start ===
Hello <>
world.
-> END
`);
    expect(res).toEqual(expected);
});

/**
 * <> on its own new line still glues the text visually into the same line, but it
 * does not remove the click: the previous step must still wait for user input.
 */
test("Glue at the start of a new line still waits for the click", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    dialogue: "Hello",
                    glueEnabled: true,
                    goNextStep: false,
                },
                {
                    dialogue: " world.",
                },
                {
                    end: "game_end",
                },
            ],
        },
    };
    const res = convertInkText(`
=== start ===
Hello
<> world.
-> END
`);
    expect(res).toEqual(expected);
});

/**
 * The same "glue at the start of a label is invisible" rule must also hold when
 * the label is entered through a tunnel divert (-> label ->) rather than a jump.
 */
test("Glue at the start of a label is invisible through a tunnel divert", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                { dialogue: "Ready?" },
                {
                    labelToOpen: {
                        label: "next",
                        type: "call",
                    },
                },
                {
                    dialogue: "Done.",
                },
                {
                    end: "game_end",
                },
            ],
            next: [
                {
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " Go!",
                },
            ],
        },
    };
    const res = convertInkText(`
=== start ===
Ready?
-> next ->
Done.
-> END

=== next ===
<> Go!
->->
`);
    expect(res).toEqual(expected);
});
