import { PixiVNJson } from '@drincs/pixi-vn';
import { expect, test } from 'vitest';
import { convertInkText } from '../src/functions';

test('Label test 1', async () => {
	let expected: PixiVNJson = {
		labels: {
			back_in_london: [
				{
					dialogue: "We arrived into London at 9.45pm exactly.",
				},
				{
					labelToOpen: {
						label: "hurry_home",
						type: "call",
					},
				},
			],
			hurry_home: [
				{
					dialogue: "We hurried home to Savile Row as fast as we could.",
				},
				{
					end: "label_end",
				},
			]
		}
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
	let expected: PixiVNJson = {
		labels: {
			back_in_london: [
				{
					dialogue: "We arrived into London at 9.45pm exactly.",
				},
				{
					end: "game_end",
				},
			],
			hurry_home: [
				{
					dialogue: "We hurried home to Savile Row as fast as we could.",
				},
				{
					end: "label_end",
				},
			]
		}
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

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#the-first-stitch-is-the-default
 */
test('The first stitch is the default', async () => {
	let expected: PixiVNJson = {
		labels: {
			"the_orient_express_|_c-0": [
				{
					labelToOpen: {
						label: "the_orient_express_|_in_first_class",
						type: "call",
					},
					glueEnabled: undefined,
					goNextStep: undefined,
				},
			],
			"the_orient_express_|_c-1": [
				{
					labelToOpen: {
						label: "the_orient_express_|_in_second_class",
						type: "call",
					},
					glueEnabled: undefined,
					goNextStep: undefined,
				},
			],
			"the_orient_express_|_in_first_class": [
				{
					dialogue: "First class was luxurious.",
				},
			],
			"the_orient_express_|_in_second_class": [
				{
					dialogue: "Second class was cramped.",
				},
			],
			the_orient_express: [
				{
					dialogue: "We boarded the train, but where?",
				},
				{
					choices: [
						{
							text: "First class",
							label: "the_orient_express_|_c-0",
							oneTime: true,
							props: {},
							type: "call",
						},
						{
							text: "Second class",
							label: "the_orient_express_|_c-1",
							oneTime: true,
							props: {},
							type: "call",
						},
					],
				},
			],
		}
	}
	let res = convertInkText(`
=== the_orient_express ===

We boarded the train, but where?
*	[First class] -> in_first_class
*	[Second class] -> in_second_class

= in_first_class
	First class was luxurious.
= in_second_class
	Second class was cramped.
`);
	expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#local-diverts
 */
test('Local diverts', async () => {
	let expected: PixiVNJson = {
		labels: {
			"the_orient_express_|_in_first_class_|_c-0": [
				{
					labelToOpen: {
						label: "the_orient_express_|_in_third_class",
						type: "call",
					},
					glueEnabled: undefined,
					goNextStep: undefined,
				},
			],
			"the_orient_express_|_in_first_class": [
				{
					dialogue: "I settled my master.",
				},
				{
					choices: [
						{
							text: "Move to third class",
							label: "the_orient_express_|_in_first_class_|_c-0",
							oneTime: true,
							props: {},
							type: "call",
						},
					],
				},
			],
			"the_orient_express_|_in_third_class": [
				{
					dialogue: "I put myself in third.",
				},
				{
					end: "label_end",
				},
			],
			the_orient_express: [
				{
					labelToOpen: {
						label: "the_orient_express_|_in_first_class",
						type: "call",
					},
					glueEnabled: undefined,
					goNextStep: undefined,
				},
			],
		}
	}
	let res = convertInkText(`
-> the_orient_express
=== the_orient_express ===
= in_first_class
	I settled my master.
	*	[Move to third class]
		-> in_third_class

= in_third_class
	I put myself in third.
	->DONE
`);
	expect(res).toEqual(expected);
});
