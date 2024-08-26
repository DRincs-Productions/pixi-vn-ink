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
					conditionalStep: {
						type: "stepswitch",
						elements: [
							{
								dialogue: "\"Three!\"",
							},
							{
								dialogue: "\"Two!\"",
							},
							{
								dialogue: "\"One!\"",
							},
							{
								dialogue: "There was the white noise racket of an explosion.",
							},
							{
								dialogue: "But it was just static.",
							},
						],
						choiceType: "sequential",
						end: undefined,
						nestedId: undefined,
					},
				},
				{
					conditionalStep: {
						type: "stepswitch",
						elements: [
							{
								dialogue: "I bought a coffee with my five-pound note.",
							},
							{
								dialogue: "I bought a second coffee for my friend.",
							},
							{
								dialogue: "I didn't have enough money to buy any more coffee.",
							},
						],
						choiceType: "sequential",
						end: undefined,
						nestedId: undefined,
					},
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
					conditionalStep: {
						type: "stepswitch",
						elements: [
							{
								dialogue: "Monday",
							},
							{
								dialogue: "Tuesday",
							},
							{
								dialogue: "Wednesday",
							},
							{
								dialogue: "Thursday",
							},
							{
								dialogue: "Friday",
							},
							{
								dialogue: "Saturday",
							},
							{
								dialogue: "Sunday",
							},
						],
						choiceType: "loop",
						nestedId: undefined,
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
					conditionalStep: {
						type: "stepswitch",
						elements: [
							{
								dialogue: "I laughed politely.",
							},
							{
								dialogue: "I smiled.",
							},
							{
								dialogue: "I grimaced.",
							},
							{
								dialogue: "I promised myself to not react again.",
							},
						],
						choiceType: "sequential",
						end: undefined,
						nestedId: undefined,
					},
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
					conditionalStep: {
						type: "stepswitch",
						elements: [
							{
								dialogue: "Heads",
							},
							{
								dialogue: "Tails",
							},
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
		labels: {
			"whack_a_mole_|_c-0": [
				{
					dialogue: " \t",
					goNextStep: true,
				},
				{
					labelToOpen: {
						label: "whack_a_mole",
						type: "call",
					},
					glueEnabled: true,
				},
			],
			"whack_a_mole_|_c-1": [
				{
					labelToOpen: {
						label: "whack_a_mole",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"whack_a_mole_|_c-2": [
				{
					labelToOpen: {
						label: "whack_a_mole",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"whack_a_mole_|_c-3": [
				{
					dialogue: " \t",
					goNextStep: true,
				},
				{
					labelToOpen: {
						label: "whack_a_mole",
						type: "call",
					},
					glueEnabled: true,
				},
			],
			"whack_a_mole_|_c-4": [
				{
					dialogue: " \t",
					goNextStep: true,
				},
				{
					labelToOpen: {
						label: "whack_a_mole",
						type: "call",
					},
					glueEnabled: true,
				},
			],
			"whack_a_mole_|_c-5": [
				{
					dialogue: "Then you collapse from hunger. The mole has defeated you!",
				},
				{
					end: "game_end",
				},
			],
			whack_a_mole: [
				{
					conditionalStep: {
						type: "stepswitch",
						elements: [
							{
								dialogue: "I heft the hammer.",
							},
							{
								conditionalStep: {
									type: "stepswitch",
									elements: [
										{
											dialogue: "Missed!",
										},
										{
											dialogue: "Nothing!",
										},
										{
											dialogue: "No good. Where is he?",
										},
										[
											{
												dialogue: "Ah-ha! Got him! ",
											},
											{
												end: "game_end",
											},
										],
									],
									choiceType: "random",
								},
							},
						],
						choiceType: "sequential",
						end: undefined,
						nestedId: undefined,
					},
				},
				{
					dialogue: "The ",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					conditionalStep: {
						type: "stepswitch",
						elements: [
							{
								dialogue: "mole",
							},
							[
								{
									conditionalStep: {
										type: "stepswitch",
										elements: [
											{
												dialogue: "nasty",
											},
											{
												dialogue: "blasted",
											},
											{
												dialogue: "foul",
											},
										],
										choiceType: "loop",
									},
								},
								{
									dialogue: " ",
								},
								{
									conditionalStep: {
										type: "stepswitch",
										elements: [
											{
												dialogue: "creature",
											},
											{
												dialogue: "rodent",
											},
										],
										choiceType: "loop",
									},
								},
							],
						],
						choiceType: "loop",
					},
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: " is ",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					conditionalStep: {
						type: "stepswitch",
						elements: [
							{
								dialogue: "in here somewhere",
							},
							{
								dialogue: "hiding somewhere",
							},
							{
								dialogue: "still at large",
							},
							{
								dialogue: "laughing at me",
							},
							{
								dialogue: "still unwhacked",
							},
							{
								dialogue: "doomed",
							},
						],
						choiceType: "sequential",
						end: undefined,
						nestedId: undefined,
					},
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: ". ",
				},
				{
					glueEnabled: true,
					goNextStep: true,
				},
				{
					conditionalStep: {
						type: "stepswitch",
						elements: [
							{
								dialogue: "I'll show him!",
							},
							{
								dialogue: "But this time he won't escape!",
							},
						],
						choiceType: "sequential",
						end: undefined,
						nestedId: undefined,
					},
				},
				{
					choices: [
						{
							text: [
								{
									conditionalChoice: {
										type: "stepswitch",
										elements: [
											{
												text: "Hit",
											},
											{
												text: "Smash",
											},
											{
												text: "Try",
											},
										],
										choiceType: "loop",
									},
								},
								" top-left",
							],
							label: "whack_a_mole_|_c-0",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: [
								{
									conditionalChoice: {
										type: "stepswitch",
										elements: [
											{
												text: "Whallop",
											},
											{
												text: "Splat",
											},
											{
												text: "Whack",
											},
										],
										choiceType: "loop",
									},
								},
								" top-right",
							],
							label: "whack_a_mole_|_c-1",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: [
								{
									conditionalChoice: {
										type: "stepswitch",
										elements: [
											{
												text: "Blast",
											},
											{
												text: "Hammer",
											},
										],
										choiceType: "loop",
									},
								},
								" middle",
							],
							label: "whack_a_mole_|_c-2",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: [
								{
									conditionalChoice: {
										type: "stepswitch",
										elements: [
											{
												text: "Clobber",
											},
											{
												text: "Bosh",
											},
										],
										choiceType: "loop",
									},
								},
								" bottom-left",
							],
							label: "whack_a_mole_|_c-3",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: [
								{
									conditionalChoice: {
										type: "stepswitch",
										elements: [
											{
												text: "Nail",
											},
											{
												text: "Thump",
											},
										],
										choiceType: "loop",
									},
								},
								" bottom-right",
							],
							label: "whack_a_mole_|_c-4",
							props: {},
							type: "call",
							oneTime: true,
						},
					],
				},
			],
		}
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
		labels: {
			"turn_on_television_|_c-0": [
				{
					dialogue: "\t \t\t",
					goNextStep: true,
				},
				{
					labelToOpen: {
						label: "turn_on_television",
						type: "call",
					},
					glueEnabled: true,
				},
			],
			"turn_on_television_|_c-1": [
				{
					dialogue: "\t",
					goNextStep: true,
				},
				{
					labelToOpen: {
						label: "go_outside_instead",
						type: "call",
					},
					glueEnabled: true,
				},
			],
			turn_on_television: [
				{
					dialogue: "I turned on the television ",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					conditionalStep: {
						type: "stepswitch",
						elements: [
							{
								dialogue: "for the first time",
							},
							{
								dialogue: "for the second time",
							},
							{
								dialogue: "again",
							},
							{
								dialogue: "once more",
							},
						],
						choiceType: "sequential",
						end: undefined,
						nestedId: undefined,
					},
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: ", but there was ",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					conditionalStep: {
						type: "stepswitch",
						elements: [
							{
								dialogue: "nothing good on, so I turned it off again",
							},
							{
								dialogue: "still nothing worth watching",
							},
							{
								dialogue: "even less to hold my interest than before",
							},
							{
								dialogue: "nothing but rubbish",
							},
							{
								dialogue: "a program about sharks and I don't like sharks",
							},
							{
								dialogue: "nothing on",
							},
						],
						choiceType: "sequential",
						end: undefined,
						nestedId: undefined,
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
							text: [
								"Try it again",
							],
							label: "turn_on_television_|_c-0",
							props: {
							},
							type: "call",
							oneTime: false,
						},
						{
							text: [
								"Go outside instead",
							],
							label: "turn_on_television_|_c-1",
							props: {
							},
							type: "call",
							oneTime: true,
						},
					],
				},
			],
			go_outside_instead: [
				{
					end: "game_end",
				},
			],
		}
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
