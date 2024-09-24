import { PixiVNJson } from '@drincs/pixi-vn-json';
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
							oneTime: true,
							props: {},
							type: "jump",
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
							oneTime: true,
							props: {},
							type: "jump",
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
					dialogue: "Hello ",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: " right back to you!",
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
							oneTime: true,
							props: {},
							type: "jump",
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
					dialogue: "\"I am somewhat tired",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: ",\" I repeated.",
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
							oneTime: true,
							props: {},
							type: "jump",
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
					dialogue: "\"I am somewhat tired",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: ",\" I repeated.",
				},
				{
					dialogue: "\"Really,\" he responded. \"How deleterious.\"",
				},
			],
			"test_|_c-1": [
				{
					dialogue: "\"Nothing, Monsieur!\"",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: " I replied.",
				},
				{
					dialogue: "\"Very good, then.\"",
				},
			],
			"test_|_c-2": [
				{
					dialogue: "\"I said, this journey is appalling",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: " and I want no more of it.\"",
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
							text: ["\"I am somewhat tired", ".\"",],
							label: "test_|_c-0",
							oneTime: true,
							props: {},
							type: "jump",
						},
						{
							text: "\"Nothing, Monsieur!\"",
							label: "test_|_c-1",
							oneTime: true,
							props: {},
							type: "jump",
						},
						{
							text: ["\"I said, this journey is appalling", ".\"",],
							label: "test_|_c-2",
							oneTime: true,
							props: {},
							type: "jump",
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
						label: "paragraph_2",
						type: "jump",
					},
					goNextStep: undefined,
				},
			],
			"paragraph_1_|_c-1": [
				{
					labelToOpen: {
						label: "paragraph_3",
						type: "jump",
					},
					goNextStep: undefined,
				},
			],
			"paragraph_1_|_c-2": [
				{
					labelToOpen: {
						label: "paragraph_4",
						type: "jump",
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
							oneTime: true,
							props: {},
							type: "jump",
						},
						{
							text: "Smash down the gate",
							label: "paragraph_1_|_c-1",
							oneTime: true,
							props: {},
							type: "jump",
						},
						{
							text: "Turn back and go home",
							label: "paragraph_1_|_c-2",
							oneTime: true,
							props: {},
							type: "jump",
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
					goNextStep: true,
				},
			],
			paragraph_3: [
				{
					dialogue: "You open the gate, and step out onto the path.",
				},
				{
					end: "label_end",
					goNextStep: true,
				},
			],
			paragraph_4: [
				{
					dialogue: "You open the gate, and step out onto the path.",
				},
				{
					end: "label_end",
					goNextStep: true,
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

/**
 * Varying Choices
 */

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#example-of-a-fallback-choice
 */
test('Example of a fallback choice', async () => {
	let expected: PixiVNJson = {
		labels: {
			"find_help_|_c-0": [
				{
					dialogue: "The woman in the hat",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: " pushes you roughly aside. ",
					goNextStep: true,
				},
				{
					labelToOpen: {
						label: "find_help",
						type: "jump",
					},
					glueEnabled: true,
				},
			],
			"find_help_|_c-1": [
				{
					dialogue: "The man with the briefcase",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: " looks disgusted as you stumble past him. ",
					goNextStep: true,
				},
				{
					labelToOpen: {
						label: "find_help",
						type: "jump",
					},
					glueEnabled: true,
				},
			],
			"find_help_|_c-2": [
				{
					dialogue: "But it is too late: you collapse onto the station platform. This is the end.",
				},
				{
					end: "game_end",
				},
			],
			find_help: [
				{
					dialogue: "You search desperately for a friendly face in the crowd.",
				},
				{
					choices: [
						{
							text: ["The woman in the hat", "?",],
							label: "find_help_|_c-0",
							props: {},
							type: "jump",
							oneTime: true,
						},
						{
							text: ["The man with the briefcase", "?",],
							label: "find_help_|_c-1",
							props: {},
							type: "jump",
							oneTime: true,
						},
					],
				},
			],
		}
	}
	let res = convertInkText(`
-> find_help
=== find_help ===

	You search desperately for a friendly face in the crowd.
	*	The woman in the hat[?] pushes you roughly aside. -> find_help
	*	The man with the briefcase[?] looks disgusted as you stumble past him. -> find_help
	*	->
		But it is too late: you collapse onto the station platform. This is the end.
		-> END
`);
	expect(res).toEqual(expected);
});


/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#sticky-choices
 */
test('Sticky choices', async () => {
	let expected: PixiVNJson = {
		labels: {
			"homers_couch_|_c-0": [
				{
					dialogue: "You eat another donut. ",
					goNextStep: true,
				},
				{
					labelToOpen: {
						label: "homers_couch",
						type: "jump",
					},
					glueEnabled: true,
				},
			],
			"homers_couch_|_c-1": [
				{
					dialogue: "You struggle up off the couch to go and compose epic poetry.",
				},
				{
					end: "game_end",
				},
			],
			homers_couch: [
				{
					choices: [
						{
							text: "Eat another donut",
							label: "homers_couch_|_c-0",
							props: {},
							type: "jump",
							oneTime: false,
						},
						{
							text: "Get off the couch",
							label: "homers_couch_|_c-1",
							props: {},
							type: "jump",
							oneTime: true,
						},
					],
				},
			],
		}
	}
	let res = convertInkText(`
-> homers_couch
=== homers_couch ===
	+	[Eat another donut]
		You eat another donut. -> homers_couch
	*	[Get off the couch]
		You struggle up off the couch to go and compose epic poetry.
		-> END
`);
	expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#conditional-choices
 */
test('Conditional Choices', async () => {
	let expected: PixiVNJson = {
		labels: {
			"visit_paris_|_c-0": [
				{
					labelToOpen: {
						label: "visit_paris",
						type: "jump",
					},
				},
			],
			"visit_paris_|_c-1": [
				{
					labelToOpen: {
						label: "visit_paris",
						type: "jump",
					},
				},
			],
			"visit_paris_|_c-2": [
				{
					labelToOpen: {
						label: "phone_estelle",
						type: "jump",
					},
				},
			],
			"visit_paris_|_c-3": [
				{
					labelToOpen: {
						label: "bored_of_paris",
						type: "jump",
					},
				},
			],
			"visit_paris_|_met_estelle": [
				{
					dialogue: "met_estelle",
				},
				{
					end: "label_end",
					goNextStep: true,
				},
			],
			visit_paris: [
				{
					choices: [
						{
							type: "ifelse",
							condition: {
								type: "union",
								unionType: "not",
								condition: {
									type: "value",
									storageType: "label",
									storageOperationType: "get",
									label: "visit_paris",
								},
							},
							then: {
								text: "Go to Paris",
								label: "visit_paris_|_c-0",
								props: {},
								type: "jump",
								oneTime: true,
							},
						},
						{
							type: "ifelse",
							condition: {
								type: "union",
								unionType: "and",
								conditions: [
									{
										type: "value",
										storageType: "label",
										storageOperationType: "get",
										label: "visit_paris",
									},
									{
										type: "union",
										unionType: "not",
										condition: {
											type: "value",
											storageType: "label",
											storageOperationType: "get",
											label: "bored_of_paris",
										},
									},
								],
							},
							then: {
								text: "Return to Paris",
								label: "visit_paris_|_c-1",
								props: {},
								type: "jump",
								oneTime: false,
							},
						},
						{
							type: "ifelse",
							condition: {
								type: "value",
								storageType: "label",
								storageOperationType: "get",
								label: "visit_paris_|_met_estelle",
							},
							then: {
								text: " Telephone Mme Estelle ",
								label: "visit_paris_|_c-2",
								props: {},
								type: "jump",
								oneTime: true,
							},
						},
						{
							type: "ifelse",
							condition: {
								type: "union",
								unionType: "or",
								conditions: [
									{
										type: "union",
										unionType: "and",
										conditions: [
											{
												type: "union",
												unionType: "and",
												conditions: [
													{
														type: "union",
														unionType: "not",
														condition: {
															type: "union",
															unionType: "or",
															conditions: [
																{
																	type: "union",
																	unionType: "or",
																	conditions: [
																		{
																			type: "value",
																			storageType: "label",
																			storageOperationType: "get",
																			label: "visit_paris",
																		},
																		{
																			type: "value",
																			storageType: "label",
																			storageOperationType: "get",
																			label: "phone_estelle",
																		},
																	],
																},
																{
																	type: "value",
																	storageType: "label",
																	storageOperationType: "get",
																	label: "bored_of_paris",
																},
															],
														},
													},
													{
														type: "union",
														unionType: "or",
														conditions: [
															{
																type: "value",
																storageType: "label",
																storageOperationType: "get",
																label: "phone_estelle",
															},
															{
																type: "union",
																unionType: "not",
																condition: {
																	type: "value",
																	storageType: "label",
																	storageOperationType: "get",
																	label: "bored_of_paris",
																},
															},
														],
													},
												],
											},
											{
												type: "union",
												unionType: "or",
												conditions: [
													{
														type: "value",
														storageType: "label",
														storageOperationType: "get",
														label: "phone_estelle",
													},
													{
														type: "union",
														unionType: "not",
														condition: {
															type: "value",
															storageType: "label",
															storageOperationType: "get",
															label: "bored_of_paris",
														},
													},
												],
											},
										],
									},
									{
										type: "union",
										unionType: "not",
										condition: {
											type: "value",
											storageType: "label",
											storageOperationType: "get",
											label: "bored_of_paris",
										},
									},
								],
							},
							then: {
								text: " Wait. Go where? I'm confused. ",
								label: "visit_paris_|_c-3",
								props: {},
								type: "jump",
								oneTime: true,
							},
						},
						{
							type: "ifelse",
							condition: {
								type: "compare",
								operator: ">",
								rightValue: 3,
								leftValue: {
									type: "value",
									storageType: "label",
									storageOperationType: "get",
									label: "visit_paris",
								},
							},
							then: {
								text: "Flat-out arrest Mr Jefferson",
								label: "visit_paris_|_c-4",
								props: {},
								type: "jump",
								oneTime: true,
							},
						},
					],
				},
			],
			phone_estelle: [
				{
					dialogue: "phone_estelle",
				},
				{
					end: "label_end",
					goNextStep: true,
				},
			],
			bored_of_paris: [
				{
					dialogue: "bored_of_paris",
				},
				{
					end: "label_end",
					goNextStep: true,
				},
			],
		}
	}
	let res = convertInkText(`
-> visit_paris
=== visit_paris ===
*	{ not visit_paris } 	[Go to Paris] -> visit_paris
+ 	{ visit_paris } { not bored_of_paris }
	[Return to Paris] -> visit_paris
*	{ visit_paris.met_estelle } [ Telephone Mme Estelle ] -> phone_estelle
*	{ (not (visit_paris or phone_estelle || bored_of_paris) && (phone_estelle || not bored_of_paris) && (phone_estelle || not bored_of_paris)) || not bored_of_paris } [ Wait. Go where? I'm confused. ] -> bored_of_paris
* 	{visit_paris > 3} [Flat-out arrest Mr Jefferson]
= met_estelle
met_estelle
-> DONE

=== phone_estelle ===
phone_estelle
-> DONE

=== bored_of_paris ===
bored_of_paris
-> DONE
`);
	expect(res).toEqual(expected);
});
