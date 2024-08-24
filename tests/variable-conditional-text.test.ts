import { PixiVNJson } from '@drincs/pixi-vn';
import { expect, test } from 'vitest';
import { convertInkText } from '../src/functions';

// Variable Text
// https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#8-variable-text

test('Sequences (the default)', async () => {
	let expected: PixiVNJson = {
		labels: {
			"loop_|_c-0": [
				{
					labelToOpen: {
						label: "loop",
						type: "call",
					},
					glueEnabled: undefined,
					goNextStep: false,
				},
			],
			"loop_|_c-1": [
				{
					dialogue: " ",
				},
				{
					end: "game_end",
				},
			],
			loop: [
				{
					dialogue: "The radio hissed into life. ",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: {
						type: "stepswitch",
						elements: [
							"\"Three!\"",
							"\"Two!\"",
							"\"One!\"",
							"There was the white noise racket of an explosion.",
							"But it was just static.",
						],
						choiceType: "sequential",
						end: undefined,
					},
					glueEnabled: false,
					goNextStep: false,
				},
				{
					dialogue: {
						type: "stepswitch",
						elements: [
							"I bought a coffee with my five-pound note.",
							"I bought a second coffee for my friend.",
							"I didn't have enough money to buy any more coffee.",
						],
						choiceType: "sequential",
						end: undefined,
					},
					glueEnabled: false,
					goNextStep: false,
				},
				{
					choices: [
						{
							text: " Loop ",
							label: "loop_|_c-0",
							props: {},
							type: "call",
							oneTime: false,
						},
						{
							text: " Exit ",
							label: "loop_|_c-1",
							props: {},
							type: "call",
							oneTime: false,
						},
					],
				},
			],
		}
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
		labels: {
			"loop_|_c-0": [
				{
					labelToOpen: {
						label: "loop",
						type: "call",
					},
					glueEnabled: undefined,
					goNextStep: false,
				},
			],
			"loop_|_c-1": [
				{
					dialogue: " ",
				},
				{
					end: "game_end",
				},
			],
			loop: [
				{
					dialogue: "It was ",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: {
						type: "stepswitch",
						elements: [
							"Monday",
							"Tuesday",
							"Wednesday",
							"Thursday",
							"Friday",
							"Saturday",
							"Sunday",
						],
						choiceType: "loop",
					},
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: " today.",
				},
				{
					choices: [
						{
							text: " Loop ",
							label: "loop_|_c-0",
							props: {},
							type: "call",
							oneTime: false,
						},
						{
							text: " Exit ",
							label: "loop_|_c-1",
							props: {},
							type: "call",
							oneTime: false,
						},
					],
				},
			],
		}
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
		labels: {
			"loop_|_c-0": [
				{
					labelToOpen: {
						label: "loop",
						type: "call",
					},
					glueEnabled: undefined,
					goNextStep: false,
				},
			],
			"loop_|_c-1": [
				{
					dialogue: " ",
				},
				{
					end: "game_end",
				},
			],
			loop: [
				{
					dialogue: "He told me a joke. ",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: {
						type: "stepswitch",
						elements: [
							"I laughed politely.",
							"I smiled.",
							"I grimaced.",
							"I promised myself to not react again.",
						],
						choiceType: "sequential",
						end: undefined,
					},
					glueEnabled: false,
					goNextStep: false,
				},
				{
					choices: [
						{
							text: " Loop ",
							label: "loop_|_c-0",
							props: {
							},
							type: "call",
							oneTime: false,
						},
						{
							text: " Exit ",
							label: "loop_|_c-1",
							props: {
							},
							type: "call",
							oneTime: false,
						},
					],
				},
			],
		}
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
		labels: {
			"loop_|_c-0": [
				{
					labelToOpen: {
						label: "loop",
						type: "call",
					},
					glueEnabled: undefined,
					goNextStep: false,
				},
			],
			"loop_|_c-1": [
				{
					dialogue: " ",
				},
				{
					end: "game_end",
				},
			],
			loop: [
				{
					dialogue: "I tossed the coin. ",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: {
						type: "stepswitch",
						elements: [
							"Heads",
							"Tails",
						],
						choiceType: "random",
					},
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: ".",
				},
				{
					choices: [
						{
							text: " Loop ",
							label: "loop_|_c-0",
							props: {},
							type: "call",
							oneTime: false,
						},
						{
							text: " Exit ",
							label: "loop_|_c-1",
							props: {},
							type: "call",
							oneTime: false,
						},
					],
				},
			],
		}
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
-> DONE
+\	{&They headed towards the Sandlands|They set off for the desert|The party followed the old road South}
-> DONE
+ [ Loop ] -> loop
+ [ Exit ] -> END

== eek==
eek
-> DONE
== leave_post_office==
leave_post_office
-> DONE
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
-> whack_a_mole
=== whack_a_mole ===
	{I heft the hammer.|{~Missed!|Nothing!|No good. Where is he?|Ah-ha! Got him! -> END}}
	The {&mole|{&nasty|blasted|foul} {&creature|rodent}} is {in here somewhere|hiding somewhere|still at large|laughing at me|still unwhacked|doomed}. <>
	{!I'll show him!|But this time he won't escape!}
	* 	[{&Hit|Smash|Try} top-left] 	-> whack_a_mole
	*  [{&Whallop|Splat|Whack} top-right] -> whack_a_mole
	*  [{&Blast|Hammer} middle] -> whack_a_mole
	*  [{&Clobber|Bosh} bottom-left] 	-> whack_a_mole
	*  [{&Nail|Thump} bottom-right] 	-> whack_a_mole
	*   ->
    	    Then you collapse from hunger. The mole has defeated you!
            -> END
`);
	expect(res).toEqual(expected);
});

test('Examples 2', async () => {
	let expected: PixiVNJson = {
		labels: {}
	}
	let res = convertInkText(`
-> turn_on_television
=== turn_on_television ===
I turned on the television {for the first time|for the second time|again|once more}, but there was {nothing good on, so I turned it off again|still nothing worth watching|even less to hold my interest than before|nothing but rubbish|a program about sharks and I don't like sharks|nothing on}.
+	[Try it again]	 		-> turn_on_television
*	[Go outside instead]	-> go_outside_instead

=== go_outside_instead ===
-> END
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
