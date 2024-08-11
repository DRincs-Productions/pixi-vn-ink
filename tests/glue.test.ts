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