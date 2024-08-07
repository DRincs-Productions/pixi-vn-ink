import { test } from 'vitest';
import { convertInkText } from './src/functions';

// Choices
// https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#2-choices

test('Choices test 1', async () => {
	let res = convertInkText(`
=== test ===
Hello world!
*	Hello back!
	Nice to hear from you!
`);
});

test('Choices test 2', async () => {
	let res = convertInkText(`
=== test ===
Hello world!
Hello world!2
*	[Hello back!]
	Nice to hear from you!
`);
});

test('Choices test 3', async () => {
	let res = convertInkText(`
=== test ===
Hello world!
*	Hello [back!] right back to you!
	Nice to hear from you!
`);
});

test('Choices test 4', async () => {
	let res = convertInkText(`
=== test ===
"What's that?" my master asked.
*	"I am somewhat tired[."]," I repeated.
	"Really," he responded. "How deleterious."
`);
});

test('Choices test 5', async () => {
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
});
