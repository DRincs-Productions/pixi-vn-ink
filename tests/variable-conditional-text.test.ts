import { PixiVNJson } from '@drincs/pixi-vn';
import { expect, test } from 'vitest';
import { convertInkText } from '../src/functions';

// Variable Text
// https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#8-variable-text

test('Sequences (the default)', async () => {
	let expected: PixiVNJson = {
		labels: {}
	}
	let res = convertInkText(`
-> loop
=== loop ===
The radio hissed into life. {"Three!"|"Two!"|"One!"|There was the white noise racket of an explosion.|But it was just static.}

{I bought a coffee with my five-pound note.|I bought a second coffee for my friend.|I didn't have enough money to buy any more coffee.}
+ [ Loop ] -> loop
+ [ Exit ] -> END
`);
	expect(res).toEqual(expected);
});

test('Cycles (marked with a &)', async () => {
	let expected: PixiVNJson = {
		labels: {}
	}
	let res = convertInkText(`
-> loop
=== loop ===
It was {&Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday} today.
+ [ Loop ] -> loop
+ [ Exit ] -> END
`);
	expect(res).toEqual(expected);
});

test('Once-only (marked with a !)', async () => {
	let expected: PixiVNJson = {
		labels: {}
	}
	let res = convertInkText(`
-> loop
=== loop ===
He told me a joke. {!I laughed politely.|I smiled.|I grimaced.|I promised myself to not react again.}
+ [ Loop ] -> loop
+ [ Exit ] -> END
`);
	expect(res).toEqual(expected);
});

test('Shuffles (marked with a ~)', async () => {
	let expected: PixiVNJson = {
		labels: {}
	}
	let res = convertInkText(`
-> loop
=== loop ===
I tossed the coin. {~Heads|Tails}.
+ [ Loop ] -> loop
+ [ Exit ] -> END
`);
	expect(res).toEqual(expected);
});

test('Features of Alternatives', async () => {
	let expected: PixiVNJson = {
		labels: {}
	}
	let res = convertInkText(`
-> loop
=== loop ===
I took a step forward. {!||||Then the lights went out. -> eek}
The Ratbear {&{wastes no time and |}swipes|scratches} {&at you|into your {&leg|arm|cheek}}.
I {waited.|waited some more.|snoozed.|woke up and waited more.|gave up and left. -> leave_post_office}
+ 	"Hello, {&Master|Monsieur Fogg|you|brown-eyes}!"[] I declared.
+\	{&They headed towards the Sandlands|They set off for the desert|The party followed the old road South}
+ [ Loop ] -> loop
+ [ Exit ] -> END
`);
	expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#examples
 */
test('Examples', async () => {
	let expected: PixiVNJson = {
		labels: {}
	}
	let res = convertInkText(`
-> loop
=== loop ===
I took a step forward. {!||||Then the lights went out. -> eek}
The Ratbear {&{wastes no time and |}swipes|scratches} {&at you|into your {&leg|arm|cheek}}.
I {waited.|waited some more.|snoozed.|woke up and waited more.|gave up and left. -> leave_post_office}
+ 	"Hello, {&Master|Monsieur Fogg|you|brown-eyes}!"[] I declared.
+\	{&They headed towards the Sandlands|They set off for the desert|The party followed the old road South}
+ [ Loop ] -> loop
+ [ Exit ] -> END
`);
	expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#conditional-text
 */
test('Conditional Text', async () => {
	let expected: PixiVNJson = {
		labels: {}
	}
	let res = convertInkText(`
-> met_blofeld
=== met_blofeld ===
{met_blofeld: "I saw him. Only for a moment." }
"His real name was {met_blofeld.learned_his_name: Franz|a secret}."
{met_blofeld: "I saw him. Only for a moment. His real name was {met_blofeld.learned_his_name: Franz|kept a secret}." | "I missed him. Was he particularly evil?" }
+ [ Loop ] -> met_blofeld
+ [ learned_his_name ] -> learned_his_name
+ [ Exit ] -> END

= learned_his_name
learned_his_name
-> met_blofeld
`);
	expect(res).toEqual(expected);
});
