import { test } from 'vitest';
import { convertInkText } from './src/functions';

test('Label test 1', async () => {
	let res = convertInkText(`
=== back_in_london ===

We arrived into London at 9.45pm exactly.
-> hurry_home

=== hurry_home ===
We hurried home to Savile Row as fast as we could.
->DONE
`);
});

// TODO: To handle the end of the game I should have the user pass me a functionok
test('Label test 2', async () => {
	let res = convertInkText(`
=== back_in_london ===

We arrived into London at 9.45pm exactly.
-> END
`);
});