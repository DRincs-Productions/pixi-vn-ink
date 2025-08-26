import { PixiVNJson } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";
import { convertInkText } from "../src/functions";

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#options-and-gathers-form-chains-of-content
 */
test("Options and gathers form chains of content", async () => {
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
                    dialogue:
                        "The road could not be much further! Mackie would have the engine running, and then I'd be safe.",
                },
                {
                    choices: [
                        {
                            text: "I reached the road and looked about",
                            label: "start_|_g-0_|_c-3",
                            props: {},
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
                    goNextStep: true,
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
        },
    };
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
test("Options can be nested", async () => {
    let expected: PixiVNJson = {
        labels: {
            "start_|_g-0_|_c-0_|_c-0": [
                {
                    dialogue: '"Detective-Inspector Japp!"',
                },
                {
                    labelToOpen: {
                        label: "start_|_g-1",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-0_|_c-1": [
                {
                    dialogue: '"Captain Hastings!"',
                },
                {
                    labelToOpen: {
                        label: "start_|_g-1",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-0_|_c-2": [
                {
                    dialogue: '"Myself!"',
                },
                {
                    labelToOpen: {
                        label: "start_|_g-1",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-0": [
                {
                    dialogue: '"Murder!"',
                },
                {
                    dialogue: '"And who did it?"',
                },
                {
                    choices: [
                        {
                            text: '"Detective-Inspector Japp!"',
                            label: "start_|_g-0_|_c-0_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: '"Captain Hastings!"',
                            label: "start_|_g-0_|_c-0_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: '"Myself!"',
                            label: "start_|_g-0_|_c-0_|_c-2",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_g-0_|_c-1_|_c-0": [
                {
                    dialogue: '"Quite sure."',
                },
                {
                    labelToOpen: {
                        label: "start_|_g-1",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-1_|_c-1": [
                {
                    dialogue: '"It is perfectly obvious."',
                },
                {
                    labelToOpen: {
                        label: "start_|_g-1",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-1": [
                {
                    dialogue: '"Suicide!"',
                },
                {
                    dialogue: '"Really, Poirot? Are you quite sure?"',
                },
                {
                    choices: [
                        {
                            text: '"Quite sure."',
                            label: "start_|_g-0_|_c-1_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: '"It is perfectly obvious."',
                            label: "start_|_g-0_|_c-1_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_g-0": [
                {
                    dialogue: '"Well, Poirot? Murder or suicide?"',
                },
                {
                    choices: [
                        {
                            text: '"Murder!"',
                            label: "start_|_g-0_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: '"Suicide!"',
                            label: "start_|_g-0_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_g-1": [
                {
                    dialogue:
                        "Mrs. Christie lowered her manuscript a moment. The rest of the writing group sat, open-mouthed.",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            start: [
                {
                    labelToOpen: {
                        label: "start_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
        },
    };
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
test("Gather points can be nested too", async () => {
    let expected: PixiVNJson = {
        labels: {
            "start_|_g-0_|_c-0_|_c-0": [
                {
                    dialogue: '"Detective-Inspector Japp!"',
                },
                {
                    labelToOpen: {
                        label: "start_|_g-0_|_c-0_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-0_|_c-1": [
                {
                    dialogue: '"Captain Hastings!"',
                },
                {
                    labelToOpen: {
                        label: "start_|_g-0_|_c-0_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-0_|_c-2": [
                {
                    dialogue: '"Myself!"',
                },
                {
                    labelToOpen: {
                        label: "start_|_g-0_|_c-0_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-0_|_g-0_|_c-3": [
                {
                    dialogue: '"Mon ami, I am deadly serious."',
                },
                {
                    labelToOpen: {
                        label: "start_|_g-1",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-0_|_g-0_|_c-4": [
                {
                    dialogue: '"If only..."',
                },
                {
                    labelToOpen: {
                        label: "start_|_g-1",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-0_|_g-0": [
                {
                    dialogue: '"You must be joking!"',
                },
                {
                    choices: [
                        {
                            text: '"Mon ami, I am deadly serious."',
                            label: "start_|_g-0_|_c-0_|_g-0_|_c-3",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: '"If only..."',
                            label: "start_|_g-0_|_c-0_|_g-0_|_c-4",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_g-0_|_c-0": [
                {
                    dialogue: '"Murder!"',
                },
                {
                    dialogue: '"And who did it?"',
                },
                {
                    choices: [
                        {
                            text: '"Detective-Inspector Japp!"',
                            label: "start_|_g-0_|_c-0_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: '"Captain Hastings!"',
                            label: "start_|_g-0_|_c-0_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: '"Myself!"',
                            label: "start_|_g-0_|_c-0_|_c-2",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_g-0_|_c-1_|_c-0": [
                {
                    dialogue: '"Quite sure."',
                },
                {
                    labelToOpen: {
                        label: "start_|_g-1",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-1_|_c-1": [
                {
                    dialogue: '"It is perfectly obvious."',
                },
                {
                    labelToOpen: {
                        label: "start_|_g-1",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-1": [
                {
                    dialogue: '"Suicide!"',
                },
                {
                    dialogue: '"Really, Poirot? Are you quite sure?"',
                },
                {
                    choices: [
                        {
                            text: '"Quite sure."',
                            label: "start_|_g-0_|_c-1_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: '"It is perfectly obvious."',
                            label: "start_|_g-0_|_c-1_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_g-0": [
                {
                    dialogue: '"Well, Poirot? Murder or suicide?"',
                },
                {
                    choices: [
                        {
                            text: '"Murder!"',
                            label: "start_|_g-0_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: '"Suicide!"',
                            label: "start_|_g-0_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_g-1": [
                {
                    dialogue:
                        "Mrs. Christie lowered her manuscript a moment. The rest of the writing group sat, open-mouthed.",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            start: [
                {
                    labelToOpen: {
                        label: "start_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
        },
    };
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

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#advanced-what-gathers-do
 */
test("Advanced: What gathers do", async () => {
    let expected: PixiVNJson = {
        labels: {
            "start_|_g-0_|_c-0_|_c-0_|_c-0_|_c-0_|_c-0": [
                {
                    dialogue: '"...Tell us a tale Captain!"',
                },
                {
                    labelToOpen: {
                        label: "start_|_g-1",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-0_|_c-0_|_c-0_|_c-0": [
                {
                    dialogue: '"... and they said to their Captain..."',
                },
                {
                    choices: [
                        {
                            text: '"...Tell us a tale Captain!"',
                            label: "start_|_g-0_|_c-0_|_c-0_|_c-0_|_c-0_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_g-0_|_c-0_|_c-0_|_c-0": [
                {
                    dialogue: '"...and the crew were restless..."',
                },
                {
                    choices: [
                        {
                            text: '"... and they said to their Captain..."',
                            label: "start_|_g-0_|_c-0_|_c-0_|_c-0_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_g-0_|_c-0_|_c-0": [
                {
                    dialogue: '"It was a dark and stormy night..."',
                },
                {
                    choices: [
                        {
                            text: '"...and the crew were restless..."',
                            label: "start_|_g-0_|_c-0_|_c-0_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_g-0_|_c-0": [
                {
                    dialogue: '"Very well, you sea-dogs. Here\'s a tale..."',
                },
                {
                    choices: [
                        {
                            text: '"It was a dark and stormy night..."',
                            label: "start_|_g-0_|_c-0_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_g-0_|_c-1": [
                {
                    dialogue: '"No, it\'s past your bed-time."',
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
                    dialogue: '"Tell us a tale, Captain!"',
                },
                {
                    choices: [
                        {
                            text: '"Very well, you sea-dogs. Here\'s a tale..."',
                            label: "start_|_g-0_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: '"No, it\'s past your bed-time."',
                            label: "start_|_g-0_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_g-1": [
                {
                    dialogue: "To a man, the crew began to yawn.",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            start: [
                {
                    labelToOpen: {
                        label: "start_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
        },
    };
    let res = convertInkText(`
-> start
=== start ==
-	"Tell us a tale, Captain!"
	*	"Very well, you sea-dogs. Here's a tale..."
		* * 	"It was a dark and stormy night..."
				* * * 	"...and the crew were restless..."
						* * * *  "... and they said to their Captain..."
								* * * * *		"...Tell us a tale Captain!"
	*	"No, it's past your bed-time."
-	To a man, the crew began to yawn.
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#example-a-conversation-with-nested-nodes
 */
test("Example: a conversation with nested nodes", async () => {
    let expected: PixiVNJson = {
        labels: {
            "start_|_g-0_|_c-0_|_c-0_|_c-0": [
                {
                    dialogue: "'But surely that is foolishness!'",
                },
                {
                    labelToOpen: {
                        label: "start_|_g-0_|_c-0_|_c-0_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-0_|_c-0_|_c-1": [
                {
                    dialogue: "'A most serious matter then!'",
                },
                {
                    labelToOpen: {
                        label: "start_|_g-0_|_c-0_|_c-0_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-0_|_c-0_|_g-0_|_c-2": [
                {
                    dialogue: "'But can we win?'",
                },
                {
                    dialogue: "'That is what we will endeavour to find out,' he answered.",
                },
                {
                    labelToOpen: {
                        label: "start_|_g-0_|_c-0_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-0_|_c-0_|_g-0_|_c-3": [
                {
                    dialogue: "'A modest wager, I trust?'",
                },
                {
                    dialogue: "'Twenty thousand pounds,' he replied, quite flatly.",
                },
                {
                    labelToOpen: {
                        label: "start_|_g-0_|_c-0_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-0_|_c-0_|_g-0_|_c-4": [
                {
                    dialogue: "I asked nothing further of him then",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: ", and after a final, polite cough, he offered nothing more to me. ",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    labelToOpen: {
                        label: "start_|_g-0_|_c-0_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-0_|_c-0_|_g-0": [
                {
                    dialogue: "He nodded again.",
                },
                {
                    choices: [
                        {
                            text: "'But can we win?'",
                            label: "start_|_g-0_|_c-0_|_c-0_|_g-0_|_c-2",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "'A modest wager, I trust?'",
                            label: "start_|_g-0_|_c-0_|_c-0_|_g-0_|_c-3",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: ["I asked nothing further of him then", "."],
                            label: "start_|_g-0_|_c-0_|_c-0_|_g-0_|_c-4",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_g-0_|_c-0_|_c-0": [
                {
                    dialogue: "'A wager!'",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " I returned.",
                },
                {
                    dialogue: "He nodded.",
                },
                {
                    choices: [
                        {
                            text: "'But surely that is foolishness!'",
                            label: "start_|_g-0_|_c-0_|_c-0_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "'A most serious matter then!'",
                            label: "start_|_g-0_|_c-0_|_c-0_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_g-0_|_c-0_|_c-1": [
                {
                    dialogue: "'Ah",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: ",' I replied, uncertain what I thought.",
                },
                {
                    labelToOpen: {
                        label: "start_|_g-0_|_c-0_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-0_|_g-0": [
                {
                    dialogue: "After that, ",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    labelToOpen: {
                        label: "start_|_g-1",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-0": [
                {
                    dialogue: "... and I could contain myself no longer.",
                },
                {
                    dialogue: "'What is the purpose of our journey, Monsieur?'",
                },
                {
                    dialogue: "'A wager,' he replied.",
                },
                {
                    choices: [
                        {
                            text: "'A wager!'",
                            label: "start_|_g-0_|_c-0_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: ["'Ah", ".'"],
                            label: "start_|_g-0_|_c-0_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_g-0_|_c-1": [
                {
                    dialogue: "... but I said nothing",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " and ",
                    glueEnabled: true,
                    goNextStep: true,
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
                    dialogue: "I looked at Monsieur Fogg",
                },
                {
                    choices: [
                        {
                            text: "... and I could contain myself no longer.",
                            label: "start_|_g-0_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "... but I said nothing",
                            label: "start_|_g-0_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_g-1_|_g-2": [
                {
                    end: "game_end",
                },
            ],
            "start_|_g-1": [
                {
                    dialogue: "we passed the day in silence.",
                },
                {
                    labelToOpen: {
                        label: "start_|_g-1_|_g-2",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            start: [
                {
                    labelToOpen: {
                        label: "start_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
        },
    };
    let res = convertInkText(`
-> start
=== start ==
- I looked at Monsieur Fogg
*	... and I could contain myself no longer.
	'What is the purpose of our journey, Monsieur?'
	'A wager,' he replied.
	* * 	'A wager!'[] I returned.
			He nodded.
			* * * 	'But surely that is foolishness!'
			* * *  'A most serious matter then!'
			- - - 	He nodded again.
			* * *	'But can we win?'
					'That is what we will endeavour to find out,' he answered.
			* * *	'A modest wager, I trust?'
					'Twenty thousand pounds,' he replied, quite flatly.
			* * * 	I asked nothing further of him then[.], and after a final, polite cough, he offered nothing more to me. <>
	* * 	'Ah[.'],' I replied, uncertain what I thought.
	- - 	After that, <>
*	... but I said nothing[] and <>
- we passed the day in silence.
- -> END
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#gathers-and-options-can-be-labelled
 */
test("Gathers and options can be labelled", async () => {
    let expected: PixiVNJson = {
        labels: {
            "meet_guard_|_c-0": [
                {
                    dialogue: "'Greetings.'",
                },
                {
                    labelToOpen: {
                        label: "meet_guard_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "meet_guard_|_c-1": [
                {
                    dialogue: "'Get out of my way",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: ",' you tell the guard.",
                },
                {
                    labelToOpen: {
                        label: "meet_guard_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "meet_guard_|_g-0_|_c-2": [
                {
                    dialogue: "'Having a nice day?' ",
                },
                {
                    labelToOpen: {
                        label: "meet_guard_|_g-1",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "meet_guard_|_g-0_|_c-3": [
                {
                    dialogue: "'Hmm?'",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " you reply.",
                },
                {
                    labelToOpen: {
                        label: "meet_guard_|_g-1",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "meet_guard_|_g-0_|_c-4": [
                {
                    dialogue: "   ",
                },
                {
                    dialogue: "You shove him sharply. He stares in reply, and draws his sword!",
                },
                {
                    labelToOpen: {
                        label: "fight_guard",
                        type: "jump",
                    },
                    glueEnabled: undefined,
                },
                {
                    labelToOpen: {
                        label: "meet_guard_|_g-1",
                        type: "call",
                    },
                    glueEnabled: true,
                },
            ],
            "meet_guard_|_g-0": [
                {
                    dialogue: "'Hmm,' replies the guard.",
                },
                {
                    choices: [
                        {
                            type: "ifelse",
                            condition: {
                                type: "value",
                                storageType: "label",
                                storageOperationType: "get",
                                label: "meet_guard_|_c-0",
                            },
                            then: {
                                text: "'Having a nice day?' ",
                                label: "meet_guard_|_g-0_|_c-2",
                                props: {},
                                type: "call",
                                oneTime: true,
                            },
                        },
                        {
                            text: "'Hmm?'",
                            label: "meet_guard_|_g-0_|_c-3",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            type: "ifelse",
                            condition: {
                                type: "value",
                                storageType: "label",
                                storageOperationType: "get",
                                label: "meet_guard_|_c-1",
                            },
                            then: {
                                text: "Shove him aside",
                                label: "meet_guard_|_g-0_|_c-4",
                                props: {},
                                type: "call",
                                oneTime: true,
                            },
                        },
                    ],
                },
            ],
            "meet_guard_|_g-1": [
                {
                    dialogue: "'Mff,' the guard replies, and then offers you a paper bag. 'Toffee?'",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            meet_guard: [
                {
                    dialogue: "The guard frowns at you.",
                },
                {
                    choices: [
                        {
                            text: "Greet him",
                            label: "meet_guard_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: ["'Get out of my way", ".'"],
                            label: "meet_guard_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            fight_guard: [
                {
                    dialogue: "fight_guard",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    let res = convertInkText(`
-> meet_guard
=== meet_guard ===
The guard frowns at you.

* 	(greet) [Greet him]
	'Greetings.'
*	(get_out) 'Get out of my way[.'],' you tell the guard.

- 	'Hmm,' replies the guard.

*	{greet} 	'Having a nice day?' // only if you greeted him

* 	'Hmm?'[] you reply.

*	{get_out} [Shove him aside] 	 // only if you threatened him
	You shove him sharply. He stares in reply, and draws his sword!
	-> fight_guard 			// this route diverts out of the weave

-	'Mff,' the guard replies, and then offers you a paper bag. 'Toffee?'
-> DONE
=== fight_guard ===
fight_guard
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#scope
 */
test("Scope", async () => {
    let expected: PixiVNJson = {
        labels: {
            "knot_|_stitch_one_|_gatherpoint": [
                {
                    dialogue: "Some content.",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            "knot_|_stitch_one": [
                {
                    labelToOpen: {
                        label: "knot_|_stitch_one_|_gatherpoint",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "knot_|_stitch_two_|_c-0": [
                {
                    dialogue: "Option",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            "knot_|_stitch_two": [
                {
                    choices: [
                        {
                            type: "ifelse",
                            condition: {
                                type: "compare",
                                leftValue: {
                                    type: "value",
                                    storageType: "label",
                                    storageOperationType: "get",
                                    label: "knot_|_stitch_one",
                                },
                                operator: ">=",
                                rightValue: {
                                    type: "value",
                                    value: 0,
                                },
                            },
                            then: {
                                text: "Option",
                                label: "knot_|_stitch_two_|_c-0",
                                props: {},
                                type: "call",
                                oneTime: true,
                            },
                            else: undefined,
                        },
                    ],
                },
            ],
            knot: [
                {
                    labelToOpen: {
                        label: "knot_|_stitch_one",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
        },
    };
    let res = convertInkText(`
-> knot
=== knot ===
= stitch_one
	- (gatherpoint) Some content.
	-> DONE
= stitch_two
	*	{stitch_one.gatherpoint} Option
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#scope
 */
test("Scope2", async () => {
    let expected: PixiVNJson = {
        labels: {
            "knot_one_|_gather_one_|_c-0": [
                {
                    dialogue: "Option",
                },
            ],
            "knot_one_|_gather_one": [
                {
                    choices: [
                        {
                            type: "ifelse",
                            condition: {
                                type: "compare",
                                leftValue: {
                                    type: "value",
                                    storageType: "label",
                                    storageOperationType: "get",
                                    label: "knot_two_|_stitch_two",
                                },
                                operator: ">=",
                                rightValue: {
                                    type: "value",
                                    value: 0,
                                },
                            },
                            then: {
                                text: "Option",
                                label: "knot_one_|_gather_one_|_c-0",
                                props: {},
                                type: "call",
                                oneTime: true,
                            },
                            else: undefined,
                        },
                    ],
                },
            ],
            knot_one: [
                {
                    labelToOpen: {
                        label: "knot_one_|_gather_one",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "knot_two_|_stitch_two_|_gather_two_|_c-0": [
                {
                    dialogue: "Option",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            "knot_two_|_stitch_two_|_gather_two": [
                {
                    choices: [
                        {
                            type: "ifelse",
                            condition: {
                                type: "compare",
                                leftValue: {
                                    type: "value",
                                    storageType: "label",
                                    storageOperationType: "get",
                                    label: "knot_one",
                                },
                                operator: ">=",
                                rightValue: {
                                    type: "value",
                                    value: 0,
                                },
                            },
                            then: {
                                text: "Option",
                                label: "knot_two_|_stitch_two_|_gather_two_|_c-0",
                                props: {},
                                type: "call",
                                oneTime: true,
                            },
                            else: undefined,
                        },
                    ],
                },
            ],
            "knot_two_|_stitch_two": [
                {
                    labelToOpen: {
                        label: "knot_two_|_stitch_two_|_gather_two",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            knot_two: [
                {
                    labelToOpen: {
                        label: "knot_two_|_stitch_two",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
        },
    };
    let res = convertInkText(`
-> knot_one
=== knot_one ===
-	(gather_one)
	* {knot_two.stitch_two.gather_two} Option

=== knot_two ===
= stitch_two
	- (gather_two)
		*	{knot_one.gather_one} Option
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#advanced-all-options-can-be-labelled
 */
test("Advanced: all options can be labelled", async () => {
    let expected: PixiVNJson = {
        labels: {
            "fight_guard_|_throw_something_|_c-0": [
                {
                    labelToOpen: {
                        label: "fight_guard_|_throw",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "fight_guard_|_throw_something_|_c-1": [
                {
                    labelToOpen: {
                        label: "fight_guard_|_throw",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "fight_guard_|_throw_something": [
                {
                    choices: [
                        {
                            text: "Throw rock at guard",
                            label: "fight_guard_|_throw_something_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "Throw sand at guard",
                            label: "fight_guard_|_throw_something_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "fight_guard_|_throw": [
                {
                    dialogue: "You hurl ",
                    goNextStep: true,
                    glueEnabled: true,
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            leftValue: {
                                type: "value",
                                storageType: "label",
                                storageOperationType: "get",
                                label: "fight_guard_|_throw_something_|_c-0",
                            },
                            operator: ">=",
                            rightValue: {
                                type: "value",
                                value: 0,
                            },
                        },
                        then: {
                            dialogue: "a rock",
                        },
                        else: {
                            dialogue: "a handful of sand",
                        },
                    },
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " at the guard.",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            fight_guard: [
                {
                    dialogue: "...",
                },
            ],
        },
    };
    let res = convertInkText(`
-> fight_guard
=== fight_guard ===
...
= throw_something
*	(rock) [Throw rock at guard] -> throw
* 	(sand) [Throw sand at guard] -> throw

= throw
You hurl {throw_something.rock:a rock|a handful of sand} at the guard.
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#advanced-loops-in-a-weave
 */
test("Advanced: Loops in a weave", async () => {
    let expected: PixiVNJson = {
        labels: {
            "fight_guard_|_opts_|_c-0": [
                {
                    dialogue: "'Can I get a uniform from somewhere?'",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " you ask the cheerful guard.",
                },
                {
                    dialogue: "'Sure. In the locker.' He grins. 'Don't think it'll fit you, though.'",
                },
                {
                    labelToOpen: {
                        label: "fight_guard_|_loop",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "fight_guard_|_opts_|_c-1": [
                {
                    dialogue: "'Tell me about the security system.'",
                },
                {
                    dialogue: "'It's ancient,' the guard assures you. 'Old as coal.'",
                },
                {
                    labelToOpen: {
                        label: "fight_guard_|_loop",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "fight_guard_|_opts_|_c-2": [
                {
                    dialogue: "'Are there dogs?'",
                },
                {
                    dialogue: "'Hundreds,' the guard answers, with a toothy grin. 'Hungry devils, too.'",
                },
                {
                    labelToOpen: {
                        label: "fight_guard_|_loop",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "fight_guard_|_opts_|_c-3": [
                {
                    labelToOpen: {
                        label: "fight_guard_|_loop_|_done",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
                {
                    labelToOpen: {
                        label: "fight_guard_|_loop",
                        type: "call",
                    },
                    glueEnabled: true,
                },
            ],
            "fight_guard_|_opts": [
                {
                    choices: [
                        {
                            text: "'Can I get a uniform from somewhere?'",
                            label: "fight_guard_|_opts_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "'Tell me about the security system.'",
                            label: "fight_guard_|_opts_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "'Are there dogs?'",
                            label: "fight_guard_|_opts_|_c-2",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            type: "ifelse",
                            condition: {
                                type: "value",
                                storageType: "label",
                                storageOperationType: "get",
                                label: "fight_guard_|_loop",
                            },
                            then: {
                                text: "Enough talking",
                                label: "fight_guard_|_opts_|_c-3",
                                props: {},
                                type: "call",
                                oneTime: true,
                            },
                        },
                    ],
                },
            ],
            "fight_guard_|_loop_|_done": [
                {
                    dialogue: "You thank the guard, and move away.",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            "fight_guard_|_loop": [
                {
                    conditionalStep: {
                        type: "stepswitch",
                        elements: [
                            {
                                labelToOpen: {
                                    label: "fight_guard_|_opts",
                                    type: "call",
                                },
                                glueEnabled: undefined,
                            },
                            {
                                labelToOpen: {
                                    label: "fight_guard_|_opts",
                                    type: "call",
                                },
                            },
                            {
                                dialogue: " ",
                            },
                        ],
                        choiceType: "sequential",
                        end: "lastItem",
                        nestedId: undefined,
                    },
                },
                {
                    dialogue: "He scratches his head.",
                },
                {
                    dialogue: "'Well, can't stand around talking all day,' he declares.",
                },
                {
                    labelToOpen: {
                        label: "fight_guard_|_loop_|_done",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            fight_guard: [
                {
                    labelToOpen: {
                        label: "fight_guard_|_opts",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
        },
    };
    let res = convertInkText(`
-> fight_guard
=== fight_guard ===
- (opts)
	*	'Can I get a uniform from somewhere?'[] you ask the cheerful guard.
		'Sure. In the locker.' He grins. 'Don't think it'll fit you, though.'
	*	'Tell me about the security system.'
		'It's ancient,' the guard assures you. 'Old as coal.'
	*	'Are there dogs?'
		'Hundreds,' the guard answers, with a toothy grin. 'Hungry devils, too.'
	// We require the player to ask at least one question
	*	{loop} [Enough talking]
		-> done
- (loop)
	// loop a few times before the guard gets bored
	{ -> opts | -> opts | }
	He scratches his head.
	'Well, can't stand around talking all day,' he declares.
- (done)
	You thank the guard, and move away.
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#advanced-diverting-to-options
 */
test("Advanced: diverting to options", async () => {
    let expected: PixiVNJson = {
        labels: {
            "fight_guard_|_opts_|_c-0": [
                {
                    dialogue: "You pull a face, and the soldier comes at you! ",
                    goNextStep: true,
                },
                {
                    labelToOpen: {
                        label: "fight_guard_|_opts_|_c-1",
                        type: "call",
                    },
                    glueEnabled: true,
                },
                {
                    labelToOpen: {
                        label: "fight_guard_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "fight_guard_|_opts_|_c-1": [
                {
                    dialogue: " You shove the guard to one side, but he comes back swinging.",
                },
                {
                    labelToOpen: {
                        label: "fight_guard_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "fight_guard_|_opts_|_c-2": [
                {
                    dialogue: " ",
                    goNextStep: true,
                },
                {
                    labelToOpen: {
                        label: "fight_the_guard",
                        type: "jump",
                    },
                    glueEnabled: true,
                },
                {
                    labelToOpen: {
                        label: "fight_guard_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "fight_guard_|_opts": [
                {
                    choices: [
                        {
                            text: "Pull a face",
                            label: "fight_guard_|_opts_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "Shove the guard aside",
                            label: "fight_guard_|_opts_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            type: "ifelse",
                            condition: {
                                type: "value",
                                storageType: "label",
                                storageOperationType: "get",
                                label: "fight_guard_|_opts_|_c-1",
                            },
                            then: {
                                text: "Grapple and fight",
                                label: "fight_guard_|_opts_|_c-2",
                                props: {},
                                type: "call",
                                oneTime: true,
                            },
                            else: undefined,
                        },
                    ],
                },
            ],
            "fight_guard_|_g-0": [
                {
                    labelToOpen: {
                        label: "fight_guard_|_opts",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            fight_guard: [
                {
                    labelToOpen: {
                        label: "fight_guard_|_opts",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            fight_the_guard: [
                {
                    dialogue: "fight_the_guard",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    let res = convertInkText(`
-> fight_guard
=== fight_guard ===
- (opts)
*	[Pull a face]
	You pull a face, and the soldier comes at you! -> shove

*	(shove) [Shove the guard aside] You shove the guard to one side, but he comes back swinging.

*	{shove} [Grapple and fight] -> fight_the_guard

- 	-> opts
-> DONE

== fight_the_guard
fight_the_guard
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#advanced-gathers-directly-after-an-option
 */
test("Advanced: Gathers directly after an option", async () => {
    let expected: PixiVNJson = {
        labels: {
            "fight_guard_|_c-0_|_quitewell": [
                {
                    dialogue: '"Quite well," he replied.',
                },
                {
                    labelToOpen: {
                        label: "fight_guard_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "fight_guard_|_c-0": [
                {
                    dialogue: '"Are you quite well, Monsieur?"',
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " I asked.",
                },
                {
                    labelToOpen: {
                        label: "fight_guard_|_c-0_|_quitewell",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "fight_guard_|_c-1": [
                {
                    dialogue: '"How did you do at the crossword, Monsieur?"',
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " I asked.",
                },
                {
                    labelToOpen: {
                        label: "fight_guard_|_c-0_|_quitewell",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
                {
                    labelToOpen: {
                        label: "fight_guard_|_g-0",
                        type: "call",
                    },
                    glueEnabled: true,
                },
            ],
            "fight_guard_|_c-2": [
                {
                    dialogue: "I said nothing",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " and neither did my Master.",
                },
                {
                    labelToOpen: {
                        label: "fight_guard_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "fight_guard_|_g-0": [
                {
                    dialogue: "We fell into companionable silence once more.",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            fight_guard: [
                {
                    choices: [
                        {
                            text: '"Are you quite well, Monsieur?"',
                            label: "fight_guard_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: '"How did you do at the crossword, Monsieur?"',
                            label: "fight_guard_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "I said nothing",
                            label: "fight_guard_|_c-2",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
        },
    };
    let res = convertInkText(`
-> fight_guard
=== fight_guard ===
*	"Are you quite well, Monsieur?"[] I asked.
	- - (quitewell) "Quite well," he replied.
*	"How did you do at the crossword, Monsieur?"[] I asked.
	-> quitewell
*	I said nothing[] and neither did my Master.
-	We fell into companionable silence once more.
-> DONE
`);
    expect(res).toEqual(expected);
});
