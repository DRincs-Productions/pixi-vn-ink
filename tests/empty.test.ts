import { expect, test } from 'vitest';
import { convertInkText } from '../src/functions';

test('Empty file test', async () => {
    let res = convertInkText(``);
    expect(res).toEqual({});
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
    expect(res).toEqual({});
});
