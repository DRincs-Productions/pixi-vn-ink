import { PixiVNJson } from '@drincs/pixi-vn';
import { expect, test } from 'vitest';
import { convertInkText } from '../src/functions';

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#1-gathers
 */
test('Gathers', async () => {
	let expected: PixiVNJson = {
		labels: {
			"start_|_c-0": [
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
				{
					labelToOpen: {
						label: "start_|_g-0",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_c-1": [
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
				{
					labelToOpen: {
						label: "start_|_g-0",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_c-2": [
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
				{
					labelToOpen: {
						label: "start_|_g-0",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_g-0": [
				{
					dialogue: "With that Monsieur Fogg left the room.",
				},
				{
					end: "label_end",
				},
			],
			start: [
				{
					dialogue: "\"What's that?\" my master asked.",
				},
				{
					choices: [
						{
							text: ["\"I am somewhat tired", ".\"",],
							label: "start_|_c-0",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: "\"Nothing, Monsieur!\"",
							label: "start_|_c-1",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: ["\"I said, this journey is appalling", ".\"",],
							label: "start_|_c-2",
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
-> start
=== start ==
"What's that?" my master asked.
	*	"I am somewhat tired[."]," I repeated.
		"Really," he responded. "How deleterious."
	*	"Nothing, Monsieur!"[] I replied.
		"Very good, then."
	*  "I said, this journey is appalling[."] and I want no more of it."
	"Ah," he replied, not unkindly. "I see you are feeling frustrated. Tomorrow, things will improve."

-	With that Monsieur Fogg left the room.
-> DONE
`);
	expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#options-and-gathers-form-chains-of-content
 */
test('Options and gathers form chains of content', async () => {
	let expected: PixiVNJson = {
		labels: {
			"start_|_c-0": [
				{
					dialogue: "I checked the jewels",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: " were still in my pocket, and the feel of them brought a spring to my step. ",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					labelToOpen: {
						label: "start_|_g-0",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_c-1": [
				{
					dialogue: "I did not pause for breath",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: " but kept on running. ",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					labelToOpen: {
						label: "start_|_g-0",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_c-2": [
				{
					dialogue: "I cheered with joy. ",
				},
				{
					labelToOpen: {
						label: "start_|_g-0",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_g-0_|_c-3": [
				{
					dialogue: "I reached the road and looked about",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: ". And would you believe it?",
				},
				{
					labelToOpen: {
						label: "start_|_g-1",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_g-0_|_c-4": [
				{
					dialogue: "I should interrupt to say Mackie is normally very reliable",
					glueEnabled: true,
					goNextStep: true,
				},
				{
					dialogue: ". He's never once let me down. Or rather, never once, previously to that night.",
				},
				{
					labelToOpen: {
						label: "start_|_g-1",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_g-0": [
				{
					dialogue: "The road could not be much further! Mackie would have the engine running, and then I'd be safe.",
				},
				{
					choices: [
						{
							text: "I reached the road and looked about",
							label: "start_|_g-0_|_c-3",
							props: {
							},
							type: "call",
							oneTime: true,
						},
						{
							text: "I should interrupt to say Mackie is normally very reliable",
							label: "start_|_g-0_|_c-4",
							props: {},
							type: "call",
							oneTime: true,
						},
					],
				},
			],
			"start_|_g-1": [
				{
					dialogue: "The road was empty. Mackie was nowhere to be seen.",
				},
				{
					end: "label_end",
				},
			],
			start: [
				{
					dialogue: "I ran through the forest, the dogs snapping at my heels.",
				},
				{
					choices: [
						{
							text: "I checked the jewels",
							label: "start_|_c-0",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: "I did not pause for breath",
							label: "start_|_c-1",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: "I cheered with joy. ",
							label: "start_|_c-2",
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
-> start
=== start ==
I ran through the forest, the dogs snapping at my heels.

	* 	I checked the jewels[] were still in my pocket, and the feel of them brought a spring to my step. <>

	*  I did not pause for breath[] but kept on running. <>

	*	I cheered with joy. <>

- 	The road could not be much further! Mackie would have the engine running, and then I'd be safe.

	*	I reached the road and looked about[]. And would you believe it?
	* 	I should interrupt to say Mackie is normally very reliable[]. He's never once let me down. Or rather, never once, previously to that night.

-	The road was empty. Mackie was nowhere to be seen.
-> DONE
`);
	expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#options-can-be-nested
 */
test('Options can be nested', async () => {
	let expected: PixiVNJson = {
		labels: {
			"start_|_c-0_|_c-0": [
				{
					dialogue: "\"Detective-Inspector Japp!\"",
				},
				{
					labelToOpen: {
						label: "start_|_g-1",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_c-0_|_c-1": [
				{
					dialogue: "\"Captain Hastings!\"",
				},
				{
					labelToOpen: {
						label: "start_|_g-1",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_c-0_|_c-2": [
				{
					dialogue: "\"Myself!\"",
				},
				{
					labelToOpen: {
						label: "start_|_g-1",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_c-0": [
				{
					dialogue: "\"Murder!\"",
				},
				{
					dialogue: "\"And who did it?\"",
				},
				{
					choices: [
						{
							text: "\"Detective-Inspector Japp!\"",
							label: "start_|_c-0_|_c-0",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: "\"Captain Hastings!\"",
							label: "start_|_c-0_|_c-1",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: "\"Myself!\"",
							label: "start_|_c-0_|_c-2",
							props: {},
							type: "call",
							oneTime: true,
						},
					],
				},
			],
			"start_|_c-1_|_c-0": [
				{
					dialogue: "\"Quite sure.\"",
				},
				{
					labelToOpen: {
						label: "start_|_g-1",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_c-1_|_c-1": [
				{
					dialogue: "\"It is perfectly obvious.\"",
				},
				{
					labelToOpen: {
						label: "start_|_g-1",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_c-1": [
				{
					dialogue: "\"Suicide!\"",
				},
				{
					dialogue: "\"Really, Poirot? Are you quite sure?\"",
				},
				{
					choices: [
						{
							text: "\"Quite sure.\"",
							label: "start_|_c-1_|_c-0",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: "\"It is perfectly obvious.\"",
							label: "start_|_c-1_|_c-1",
							props: {},
							type: "call",
							oneTime: true,
						},
					],
				},
			],
			"start_|_g-1": [
				{
					dialogue: "Mrs. Christie lowered her manuscript a moment. The rest of the writing group sat, open-mouthed.",
				},
				{
					end: "label_end",
				},
			],
			start: [
				{
					dialogue: "\"Well, Poirot? Murder or suicide?\"",
				},
				{
					choices: [
						{
							text: "\"Murder!\"",
							label: "start_|_c-0",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: "\"Suicide!\"",
							label: "start_|_c-1",
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
-> start
=== start ==
- 	"Well, Poirot? Murder or suicide?"
	*	"Murder!"
	 	"And who did it?"
		* * 	"Detective-Inspector Japp!"
		* * 	"Captain Hastings!"
		* * 	"Myself!"
	* 	"Suicide!"
		"Really, Poirot? Are you quite sure?"
		* * 	"Quite sure."
		* *		"It is perfectly obvious."
	-	Mrs. Christie lowered her manuscript a moment. The rest of the writing group sat, open-mouthed.
-> DONE
`);
	expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#gather-points-can-be-nested-too
 */
test('Gather points can be nested too', async () => {
	let expected: PixiVNJson = {
		labels: {
			"start_|_c-0_|_c-0": [
				{
					dialogue: "\"Detective-Inspector Japp!\"",
				},
				{
					labelToOpen: {
						label: "start_|_c-0_|_g-0",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_c-0_|_c-1": [
				{
					dialogue: "\"Captain Hastings!\"",
				},
				{
					labelToOpen: {
						label: "start_|_c-0_|_g-0",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_c-0_|_c-2": [
				{
					dialogue: "\"Myself!\"",
				},
				{
					labelToOpen: {
						label: "start_|_c-0_|_g-0",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_c-0_|_g-0_|_c-3": [
				{
					dialogue: "\"Mon ami, I am deadly serious.\"",
				},
				{
					labelToOpen: {
						label: "start_|_g-1",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_c-0_|_g-0_|_c-4": [
				{
					dialogue: "\"If only...\"",
				},
				{
					labelToOpen: {
						label: "start_|_g-1",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_c-0_|_g-0": [
				{
					dialogue: "\"You must be joking!\"",
				},
				{
					choices: [
						{
							text: "\"Mon ami, I am deadly serious.\"",
							label: "start_|_c-0_|_g-0_|_c-3",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: "\"If only...\"",
							label: "start_|_c-0_|_g-0_|_c-4",
							props: {},
							type: "call",
							oneTime: true,
						},
					],
				},
			],
			"start_|_c-0": [
				{
					dialogue: "\"Murder!\"",
				},
				{
					dialogue: "\"And who did it?\"",
				},
				{
					choices: [
						{
							text: "\"Detective-Inspector Japp!\"",
							label: "start_|_c-0_|_c-0",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: "\"Captain Hastings!\"",
							label: "start_|_c-0_|_c-1",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: "\"Myself!\"",
							label: "start_|_c-0_|_c-2",
							props: {},
							type: "call",
							oneTime: true,
						},
					],
				},
			],
			"start_|_c-1_|_c-0": [
				{
					dialogue: "\"Quite sure.\"",
				},
				{
					labelToOpen: {
						label: "start_|_g-1",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_c-1_|_c-1": [
				{
					dialogue: "\"It is perfectly obvious.\"",
				},
				{
					labelToOpen: {
						label: "start_|_g-1",
						type: "call",
					},
					glueEnabled: undefined,
				},
			],
			"start_|_c-1": [
				{
					dialogue: "\"Suicide!\"",
				},
				{
					dialogue: "\"Really, Poirot? Are you quite sure?\"",
				},
				{
					choices: [
						{
							text: "\"Quite sure.\"",
							label: "start_|_c-1_|_c-0",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: "\"It is perfectly obvious.\"",
							label: "start_|_c-1_|_c-1",
							props: {},
							type: "call",
							oneTime: true,
						},
					],
				},
			],
			"start_|_g-1": [
				{
					dialogue: "Mrs. Christie lowered her manuscript a moment. The rest of the writing group sat, open-mouthed.",
				},
				{
					end: "label_end",
				},
			],
			start: [
				{
					dialogue: "\"Well, Poirot? Murder or suicide?\"",
				},
				{
					choices: [
						{
							text: "\"Murder!\"",
							label: "start_|_c-0",
							props: {},
							type: "call",
							oneTime: true,
						},
						{
							text: "\"Suicide!\"",
							label: "start_|_c-1",
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
-> start
=== start ==
- 	"Well, Poirot? Murder or suicide?"
		*	"Murder!"
		 	"And who did it?"
			* * 	"Detective-Inspector Japp!"
			* * 	"Captain Hastings!"
			* * 	"Myself!"
			- - 	"You must be joking!"
			* * 	"Mon ami, I am deadly serious."
			* *		"If only..."
		* 	"Suicide!"
			"Really, Poirot? Are you quite sure?"
			* * 	"Quite sure."
			* *		"It is perfectly obvious."
		-	Mrs. Christie lowered her manuscript a moment. The rest of the writing group sat, open-mouthed.
-> DONE
`);
	expect(res).toEqual(expected);
});
