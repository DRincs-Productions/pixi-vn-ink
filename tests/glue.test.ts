import { PixiVNJson } from '@drincs/pixi-vn';
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
                    dialog: "We hurried home to Savile Row ",
                },
                {
                    labelToOpen: {
                        labelId: "as_fast_as_we_could",
                        type: "call",
                    },
                    glueEnabled: true,
                    goNextStep: true,
                },
            ],
            as_fast_as_we_could: [
                {
                    dialog: "as fast as we could.",
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
                    dialog: "We hurried home ",
                },
                {
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    labelToOpen: {
                        labelId: "to_savile_row",
                        type: "call",
                    },
                    glueEnabled: undefined,
                    goNextStep: undefined,
                },
            ],
            to_savile_row: [
                {
                    dialog: "to Savile Row",
                },
                {
                    labelToOpen: {
                        labelId: "as_fast_as_we_could",
                        type: "call",
                    },
                    glueEnabled: undefined,
                    goNextStep: undefined,
                },
            ],
            as_fast_as_we_could: [
                {
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialog: " as fast as we could.",
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
                    dialog: [
                        "\"There is not a moment to lose!\"",
                        " I declared.",
                    ],
                },
                {
                    labelToOpen: {
                        labelId: "hurry_outside",
                        type: "call",
                    },
                    glueEnabled: undefined,
                    goNextStep: undefined,
                },
            ],
            "back_in_london_|_c-1": [
                {
                    dialog: [
                        "\"Monsieur, let us savour this moment!\"",
                        " I declared.",
                    ],
                },
                {
                    dialog: "My master clouted me firmly around the head and dragged me out of the door.",
                },
                {
                    labelToOpen: {
                        labelId: "dragged_outside",
                        type: "call",
                    },
                    glueEnabled: undefined,
                    goNextStep: undefined,
                },
            ],
            "back_in_london_|_c-2": [
                {
                    labelToOpen: {
                        labelId: "hurry_outside",
                        type: "call",
                    },
                    glueEnabled: undefined,
                    goNextStep: true,
                },
            ],
            back_in_london: [
                {
                    dialog: "We arrived into London at 9.45pm exactly.",
                },
                {
                    choices: [
                        {
                            text: "\"There is not a moment to lose!\"",
                            label: "back_in_london_|_c-0",
                            props: {
                            },
                            type: "call",
                        },
                        {
                            text: "\"Monsieur, let us savour this moment!\"",
                            label: "back_in_london_|_c-1",
                            props: {
                            },
                            type: "call",
                        },
                        {
                            text: "We hurried home",
                            label: "back_in_london_|_c-2",
                            props: {
                            },
                            type: "call",
                        },
                    ],
                },
            ],
            hurry_outside: [
                {
                    dialog: "We hurried home to Savile Row ",
                },
                {
                    labelToOpen: {
                        labelId: "as_fast_as_we_could",
                        type: "call",
                    },
                    glueEnabled: true,
                    goNextStep: true,
                },
            ],
            dragged_outside: [
                {
                    dialog: "He insisted that we hurried home to Savile Row",
                },
                {
                    labelToOpen: {
                        labelId: "as_fast_as_we_could",
                        type: "call",
                    },
                    glueEnabled: undefined,
                    goNextStep: undefined,
                },
            ],
            as_fast_as_we_could: [
                {
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialog: " as fast as we could.",
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
