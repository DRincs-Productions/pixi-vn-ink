import { expect, test } from 'vitest';
import { convertInkText } from './src/functions';

// Choices
// https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#2-choices

test('Choices test 1', async () => {
	let expected = {
		test: [
			{
				dialog: "Hello world!",
			},
			{
				currentChoiceMenuOptions: [
					{
						text: "Hello back!",
						label: "test_c-0",
					},
				],
			},
		],
		"test_c-0": [
			{
				dialog: "Hello back!",
			},
			{
				dialog: "Nice to hear from you!",
			},
		]
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
	let expected = {
		test: [
			{
				dialog: "Hello world!",
			},
			{
				dialog: "Hello world!2",
			},
			{
				currentChoiceMenuOptions: [
					{
						text: "Hello back!",
						label: "test_c-0",
					},
				],
			},
		],
		"test_c-0": [
			{
				dialog: "Nice to hear from you!",
			},
		]
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
	let expected = {
		test: [
			{
				dialog: "Hello world!",
			},
			{
				currentChoiceMenuOptions: [
					{
						text: "Hello back!",
						label: "test_c-0",
					},
				],
			},
		],
		"test_c-0": [
			{
				dialog: "Hello  right back to you!",
			},
			{
				dialog: "Nice to hear from you!",
			},
		]
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
	let expected = {
		test: [
			{
				dialog: "\"What's that?\" my master asked.",
			},
			{
				currentChoiceMenuOptions: [
					{
						text: "\"I am somewhat tired.\"",
						label: "test_c-0",
					},
				],
			},
		],
		"test_c-0": [
			{
				dialog: "\"I am somewhat tired,\" I repeated.",
			},
			{
				dialog: "\"Really,\" he responded. \"How deleterious.\"",
			},
		]
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
	let expected = {
		test: [
			{
				dialog: "\"What's that?\" my master asked.",
			},
			{
				currentChoiceMenuOptions: [
					{
						text: "\"I am somewhat tired.\"",
						label: "test_c-0",
					},
					{
						text: "\"Nothing, Monsieur!\"",
						label: "test_c-1",
					},
					{
						text: "\"I said, this journey is appalling.\"",
						label: "test_c-2",
					},
				],
			},
		],
		"test_c-0": [
			{
				dialog: "\"I am somewhat tired,\" I repeated.",
			},
			{
				dialog: "\"Really,\" he responded. \"How deleterious.\"",
			},
		],
		"test_c-1": [
			{
				dialog: "\"Nothing, Monsieur!\" I replied.",
			},
			{
				dialog: "\"Very good, then.\"",
			},
		],
		"test_c-2": [
			{
				dialog: "\"I said, this journey is appalling and I want no more of it.\"",
			},
			{
				dialog: "\"Ah,\" he replied, not unkindly. \"I see you are feeling frustrated. Tomorrow, things will improve.\"",
			},
		]
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
