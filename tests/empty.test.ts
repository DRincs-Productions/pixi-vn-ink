import { expect, test } from 'vitest';
import { convertInkText } from '../src/functions';

test('Empty file test', async () => {
    let res = convertInkText(``);
    expect(res).toEqual({ "labels": {} });
});

test('Test elements not considered', async () => {
    let res = convertInkText(`
"What do you make of this?" she asked.

// Something unprintable...

"I couldn't possibly comment," I replied.

/*
	... or an unlimited block of text
*/
`);
    expect(res).toEqual({ "labels": {} });
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#randommin-max
 */
test('exterlan temp variable', async () => {
    let res = convertInkText(`
~ temp dice_roll = RANDOM(1, 6)

~ temp lazy_grading_for_test_paper = RANDOM(30, 75)

~ temp number_of_heads_the_serpent_has = RANDOM(3, 8)
`);
    expect(res).toEqual({ "labels": {} });
});