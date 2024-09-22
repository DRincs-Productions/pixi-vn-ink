import { PixiVNJson } from '@drincs/pixi-vn-json';
import { expect, test } from 'vitest';
import { convertInkText } from '../src/functions';

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#diverts-are-invisible
 */
test('Diverts are invisible', async () => {
    let expected: PixiVNJson = {
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
        }
    }
    let res = convertInkText(`
=== hurry_home ===
We hurried home to Savile Row -> as_fast_as_we_could

=== as_fast_as_we_could ===
as fast as we could.
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#glue
 */
test('Glue', async () => {
    let expected: PixiVNJson = {
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
        }
    }
    let res = convertInkText(`
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
test('Branching and joining', async () => {
    let expected: PixiVNJson = {
        labels: {
            "back_in_london_|_c-0": [
                {
                    dialogue: "\"There is not a moment to lose!\"",
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
                    dialogue: "\"Monsieur, let us savour this moment!\"",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " I declared.",
                },
                {
                    dialogue: "My master clouted me firmly around the head and dragged me out of the door.",
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
                            text: "\"There is not a moment to lose!\"",
                            label: "back_in_london_|_c-0",
                            oneTime: true,
                            props: {},
                            type: "jump",
                        },
                        {
                            text: "\"Monsieur, let us savour this moment!\"",
                            label: "back_in_london_|_c-1",
                            oneTime: true,
                            props: {},
                            type: "jump",
                        },
                        {
                            text: "We hurried home",
                            label: "back_in_london_|_c-2",
                            oneTime: true,
                            props: {},
                            type: "jump",
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
        }
    }
    let res = convertInkText(`
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
