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
                    dialog: "undefined as fast as we could.",
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
