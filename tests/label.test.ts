import { expect, test } from 'vitest';
import { convertInkText } from '../src/functions';

test('Label test 1', async () => {
	let expected = {
		back_in_london: [
			{
				dialog: "We arrived into London at 9.45pm exactly.",
			},
			{
				labelToOpen: {
					labelId: "hurry_home",
					type: "call",
				},
			},
		],
		hurry_home: [
			{
				dialog: "We hurried home to Savile Row as fast as we could.",
			},
			{
				end: "label_end",
			},
		]
	}
	let res = convertInkText(`
=== back_in_london ===

We arrived into London at 9.45pm exactly.
-> hurry_home

=== hurry_home ===
We hurried home to Savile Row as fast as we could.
->DONE
`);
	expect(res).toEqual(expected);
});

test('Label test 2', async () => {
	let expected = {
		back_in_london: [
			{
				dialog: "We arrived into London at 9.45pm exactly.",
			},
			{
				end: "game_end",
			},
		],
		hurry_home: [
			{
				dialog: "We hurried home to Savile Row as fast as we could.",
			},
			{
				end: "label_end",
			},
		]
	}
	let res = convertInkText(`
=== back_in_london ===

We arrived into London at 9.45pm exactly.
-> END

=== hurry_home ===
We hurried home to Savile Row as fast as we could.
->DONE
`);
	expect(res).toEqual(expected);
});
