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
                        label: "start_|_g-0",
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
                        label: "start_|_g-0",
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
                        label: "start_|_g-0",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-0_|_c-3": [
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
            "start_|_g-0_|_c-4": [
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
            "start_|_g-0": [
                {
                    dialogue: "\"You must be joking!\"",
                },
                {
                    choices: [
                        {
                            text: "\"Mon ami, I am deadly serious.\"",
                            label: "start_|_g-0_|_c-3",
                            props: {
                            },
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "\"If only...\"",
                            label: "start_|_g-0_|_c-4",
                            props: {
                            },
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
                            props: {
                            },
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "\"Captain Hastings!\"",
                            label: "start_|_c-0_|_c-1",
                            props: {
                            },
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "\"Myself!\"",
                            label: "start_|_c-0_|_c-2",
                            props: {
                            },
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
                            props: {
                            },
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "\"It is perfectly obvious.\"",
                            label: "start_|_c-1_|_c-1",
                            props: {
                            },
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
                            props: {
                            },
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "\"Suicide!\"",
                            label: "start_|_c-1",
                            props: {
                            },
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

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#advanced-what-gathers-do
 */
test('Advanced: What gathers do', async () => {
    let expected: PixiVNJson = {
        labels: {
            "start_|_c-0_|_c-0_|_c-0_|_c-0_|_c-0": [
                {
                    dialogue: "\"...Tell us a tale Captain!\"",
                },
                {
                    labelToOpen: {
                        label: "start_|_g-1",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_c-0_|_c-0_|_c-0_|_c-0": [
                {
                    dialogue: "\"... and they said to their Captain...\"",
                },
                {
                    choices: [
                        {
                            text: "\"...Tell us a tale Captain!\"",
                            label: "start_|_c-0_|_c-0_|_c-0_|_c-0_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_c-0_|_c-0_|_c-0": [
                {
                    dialogue: "\"...and the crew were restless...\"",
                },
                {
                    choices: [
                        {
                            text: "\"... and they said to their Captain...\"",
                            label: "start_|_c-0_|_c-0_|_c-0_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_c-0_|_c-0": [
                {
                    dialogue: "\"It was a dark and stormy night...\"",
                },
                {
                    choices: [
                        {
                            text: "\"...and the crew were restless...\"",
                            label: "start_|_c-0_|_c-0_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_c-0": [
                {
                    dialogue: "\"Very well, you sea-dogs. Here's a tale...\"",
                },
                {
                    choices: [
                        {
                            text: "\"It was a dark and stormy night...\"",
                            label: "start_|_c-0_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "start_|_c-1": [
                {
                    dialogue: "\"No, it's past your bed-time.\"",
                },
                {
                    labelToOpen: {
                        label: "start_|_g-1",
                        type: "call",
                    },
                    glueEnabled: undefined,
                },
            ],
            "start_|_g-1": [
                {
                    dialogue: "To a man, the crew began to yawn.",
                },
                {
                    end: "label_end",
                },
            ],
            start: [
                {
                    dialogue: "\"Tell us a tale, Captain!\"",
                },
                {
                    choices: [
                        {
                            text: "\"Very well, you sea-dogs. Here's a tale...\"",
                            label: "start_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "\"No, it's past your bed-time.\"",
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
test('Example: a conversation with nested nodes', async () => {
    let expected: PixiVNJson = {
        labels: {}
    }
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
test('Gathers and options can be labelled', async () => {
    let expected: PixiVNJson = {
        labels: {}
    }
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
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#scope
 */
test('Scope', async () => {
    let expected: PixiVNJson = {
        labels: {}
    }
    let res = convertInkText(`
-> knot
=== knot ===
= stitch_one
	- (gatherpoint) Some content.
= stitch_two
	*	{stitch_one.gatherpoint} Option
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#scope
 */
test('Scope2', async () => {
    let expected: PixiVNJson = {
        labels: {}
    }
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
test('Advanced: all options can be labelled', async () => {
    let expected: PixiVNJson = {
        labels: {}
    }
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
