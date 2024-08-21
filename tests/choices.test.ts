import { PixiVNJson } from '@drincs/pixi-vn';
import { expect, test } from 'vitest';
import { convertInkText } from '../src/functions';

// Choices
// https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#2-choices

test('Choices test 1', async () => {
	let expected: PixiVNJson = {
		labels: {
			test: [
				{
					dialogue: "Hello world!",
				},
				{
					choices: [
						{
							text: "Hello back!",
							label: "test_|_c-0",
							props: {},
							type: "call",
						},
					],
				},
			],
			"test_|_c-0": [
				{
					dialogue: "Hello back!",
				},
				{
					dialogue: "Nice to hear from you!",
				},
			]
		}
	}
	let res = convertInkText(`
=== test ===
Hello world!
*	Hello back!
	Nice to hear from you!
`);
	expect(res).toEqual(expected);
});

test('Choices test 2', async () => {
	let expected: PixiVNJson = {
		labels: {
			test: [
				{
					dialogue: "Hello world!",
				},
				{
					dialogue: "Hello world!2",
				},
				{
					choices: [
						{
							text: "Hello back!",
							label: "test_|_c-0",
							props: {},
							type: "call",
						},
					],
				},
			],
			"test_|_c-0": [
				{
					dialogue: "Nice to hear from you!",
				},
			]
		}
	}
	let res = convertInkText(`
=== test ===
Hello world!
Hello world!2
*	[Hello back!]
	Nice to hear from you!
`);
	expect(res).toEqual(expected);
});

test('Choices test 3', async () => {
	let expected: PixiVNJson = {
		labels: {
			"test_|_c-0": [
				{
					dialogue: ["Hello ", " right back to you!",],
				},
				{
					dialogue: "Nice to hear from you!",
				},
			],
			test: [
				{
					dialogue: "Hello world!",
				},
				{
					choices: [
						{
							text: ["Hello ", "back!",],
							label: "test_|_c-0",
							props: {},
							type: "call",
						},
					],
				},
			],
		}
	}
	let res = convertInkText(`
=== test ===
Hello world!
*	Hello [back!] right back to you!
	Nice to hear from you!
`);
	expect(res).toEqual(expected);
});

test('Choices test 4', async () => {
	let expected: PixiVNJson = {
		labels: {
			"test_|_c-0": [
				{
					dialogue: ["\"I am somewhat tired", ",\" I repeated.",],
				},
				{
					dialogue: "\"Really,\" he responded. \"How deleterious.\"",
				},
			],
			test: [
				{
					dialogue: "\"What's that?\" my master asked.",
				},
				{
					choices: [
						{
							text: ["\"I am somewhat tired", ".\"",],
							label: "test_|_c-0",
							props: {},
							type: "call",
						},
					],
				},
			],
		}
	}
	let res = convertInkText(`
=== test ===
"What's that?" my master asked.
*	"I am somewhat tired[."]," I repeated.
	"Really," he responded. "How deleterious."
`);
	expect(res).toEqual(expected);
});

test('Choices test 5', async () => {
	let expected: PixiVNJson = {
		labels: {
			"test_|_c-0": [
				{
					dialogue: ["\"I am somewhat tired", ",\" I repeated.",],
				},
				{
					dialogue: "\"Really,\" he responded. \"How deleterious.\"",
				},
			],
			"test_|_c-1": [
				{
					dialogue: ["\"Nothing, Monsieur!\"", " I replied.",],
				},
				{
					dialogue: "\"Very good, then.\"",
				},
			],
			"test_|_c-2": [
				{
					dialogue: ["\"I said, this journey is appalling", " and I want no more of it.\"",],
				},
				{
					dialogue: "\"Ah,\" he replied, not unkindly. \"I see you are feeling frustrated. Tomorrow, things will improve.\"",
				},
			],
			test: [
				{
					dialogue: "\"What's that?\" my master asked.",
				},
				{
					choices: [
						{
							text: [
								"\"I am somewhat tired", ".\"",
							],
							label: "test_|_c-0",
							props: {},
							type: "call",
						},
						{
							text: "\"Nothing, Monsieur!\"",
							label: "test_|_c-1",
							props: {},
							type: "call",
						},
						{
							text: ["\"I said, this journey is appalling", ".\"",],
							label: "test_|_c-2",
							props: {},
							type: "call",
						},
					],
				},
			],
		}
	}
	let res = convertInkText(`
=== test ===
"What's that?" my master asked.
*	"I am somewhat tired[."]," I repeated.
	"Really," he responded. "How deleterious."
*	"Nothing, Monsieur!"[] I replied.
	"Very good, then."
*  "I said, this journey is appalling[."] and I want no more of it."
	"Ah," he replied, not unkindly. "I see you are feeling frustrated. Tomorrow, things will improve."
`);
	expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#basic-branching
 */
test('Basic branching', async () => {
	let expected: PixiVNJson = {
		labels: {
			"paragraph_1_|_c-0": [
				{
					labelToOpen: {
						labelId: "paragraph_2",
						type: "call",
					},
					goNextStep: undefined,
				},
			],
			"paragraph_1_|_c-1": [
				{
					labelToOpen: {
						labelId: "paragraph_3",
						type: "call",
					},
					goNextStep: undefined,
				},
			],
			"paragraph_1_|_c-2": [
				{
					labelToOpen: {
						labelId: "paragraph_4",
						type: "call",
					},
					goNextStep: undefined,
				},
			],
			paragraph_1: [
				{
					dialogue: "You stand by the wall of Analand, sword in hand.",
				},
				{
					choices: [
						{
							text: "Open the gate",
							label: "paragraph_1_|_c-0",
							props: {},
							type: "call",
						},
						{
							text: "Smash down the gate",
							label: "paragraph_1_|_c-1",
							props: {},
							type: "call",
						},
						{
							text: "Turn back and go home",
							label: "paragraph_1_|_c-2",
							props: {},
							type: "call",
						},
					],
				},
			],
			paragraph_2: [
				{
					dialogue: "You open the gate, and step out onto the path.",
				},
				{
					end: "label_end",
				},
			],
			paragraph_3: [
				{
					dialogue: "You open the gate, and step out onto the path.",
				},
				{
					end: "label_end",
				},
			],
			paragraph_4: [
				{
					dialogue: "You open the gate, and step out onto the path.",
				},
				{
					end: "label_end",
				},
			],
		}
	}
	let res = convertInkText(`
-> paragraph_1
=== paragraph_1 ===
You stand by the wall of Analand, sword in hand.
* [Open the gate] -> paragraph_2
* [Smash down the gate] -> paragraph_3
* [Turn back and go home] -> paragraph_4
=== paragraph_2 ===
You open the gate, and step out onto the path.
-> DONE
=== paragraph_3 ===
You open the gate, and step out onto the path.
-> DONE
=== paragraph_4 ===
You open the gate, and step out onto the path.
-> DONE
`);
	expect(res).toEqual(expected);
});
