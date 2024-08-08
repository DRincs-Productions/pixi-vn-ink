import { expect, test } from 'vitest';
import { convertInkText } from '../src/functions';

test('Label test 1', async () => {
	let res = convertInkText(`
=== back_in_london ===

We arrived into London at 9.45pm exactly.
-> hurry_home

=== hurry_home ===
We hurried home to Savile Row as fast as we could.
	->DONE -> ERROR
`);
	expect(res).toEqual(undefined);
});
