import { PixiVNJson } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";
import { convertInkToJson } from "../src/functions";

test("Threads 1", async () => {
    let expected: PixiVNJson = {
        labels: {
            thread_example: [
                {
                    dialogue: "I had a headache; threading is hard to get your head around.",
                },
                {
                    labelToOpen: {
                        label: "conversation",
                        type: "call",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
                {
                    labelToOpen: {
                        label: "walking",
                        type: "call",
                        params: undefined,
                    },
                    glueEnabled: true,
                },
            ],
            "conversation_|_c-0": [
                {
                    dialogue: '"What did you have for lunch today?"',
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " I asked.",
                },
                {
                    dialogue: '"Spam and eggs," he replied.',
                },
                {
                    labelToOpen: {
                        label: "conversation_|_g-0",
                        type: "call",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            "conversation_|_c-1": [
                {
                    dialogue: '"Nice weather, we\'re having,"',
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " I said.",
                },
                {
                    dialogue: '"I\'ve seen better," he replied.',
                },
                {
                    labelToOpen: {
                        label: "conversation_|_g-0",
                        type: "call",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            "conversation_|_g-0": [
                {
                    labelToOpen: {
                        label: "house",
                        type: "jump",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            conversation: [
                {
                    dialogue: "It was a tense moment for Monty and me.",
                },
                {
                    choices: [
                        {
                            text: '"What did you have for lunch today?"',
                            label: "conversation_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: '"Nice weather, we\'re having,"',
                            label: "conversation_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "walking_|_c-0": [
                {
                    labelToOpen: {
                        label: "house",
                        type: "jump",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            walking: [
                {
                    dialogue: "We continued to walk down the dusty road.",
                },
                {
                    choices: [
                        {
                            text: "Continue walking",
                            label: "walking_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            house: [
                {
                    dialogue: "Before long, we arrived at his house.",
                },
                {
                    end: "game_end",
                },
            ],
        },
    };
    let res = convertInkToJson(`
== thread_example ==
I had a headache; threading is hard to get your head around.
<- conversation
<- walking


== conversation ==
It was a tense moment for Monty and me.
 * "What did you have for lunch today?"[] I asked.
    "Spam and eggs," he replied.
 * "Nice weather, we're having,"[] I said.
    "I've seen better," he replied.
 - -> house

== walking ==
We continued to walk down the dusty road.
 * [Continue walking]
    -> house

== house ==
Before long, we arrived at his house.
-> END
`);
    expect(res).toEqual(expected);
});

test("Threads 2", async () => {
    let expected: PixiVNJson = {
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "player_location",
                value: 1,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "generals_location",
                value: 1,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "doctors_location",
                value: 2,
            },
        ],
        labels: {
            run_player_location: [
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: "==",
                            rightValue: 1,
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "player_location",
                            },
                        },
                        then: {
                            labelToOpen: {
                                label: "hallway",
                                type: "jump",
                                params: undefined,
                            },
                            glueEnabled: undefined,
                        },
                    },
                },
            ],
            "hallway_|_c-0": [
                {
                    dialogue: " ",
                    goNextStep: true,
                },
                {
                    labelToOpen: {
                        label: "hallway_|_examine_drawers",
                        type: "call",
                        params: undefined,
                    },
                    glueEnabled: true,
                },
                {
                    labelToOpen: {
                        label: "hallway_|_g-0",
                        type: "call",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            "hallway_|_c-1": [
                {
                    dialogue: " ",
                    goNextStep: true,
                },
                {
                    labelToOpen: {
                        label: "examine_wardrobe",
                        type: "jump",
                        params: undefined,
                    },
                    glueEnabled: true,
                },
                {
                    labelToOpen: {
                        label: "hallway_|_g-0",
                        type: "call",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            "hallway_|_c-2": [
                {
                    dialogue: "  ",
                    goNextStep: true,
                },
                {
                    labelToOpen: {
                        label: "go_office",
                        type: "jump",
                        params: undefined,
                    },
                    glueEnabled: true,
                },
                {
                    labelToOpen: {
                        label: "hallway_|_g-0",
                        type: "call",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            "hallway_|_g-0": [
                {
                    labelToOpen: {
                        label: "run_player_location",
                        type: "jump",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            "hallway_|_examine_drawers": [
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            hallway: [
                {
                    labelToOpen: {
                        label: "characters_present",
                        type: "call",
                        params: [1],
                    },
                    glueEnabled: undefined,
                },
                {
                    choices: [
                        {
                            type: "ifelse",
                            condition: 1,
                            then: {
                                text: "Drawers",
                                label: "hallway_|_c-0",
                                props: {},
                                type: "call",
                                oneTime: true,
                            },
                        },
                        {
                            text: "Wardrobe",
                            label: "hallway_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "Go to Office",
                            label: "hallway_|_c-2",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            characters_present: [
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: "==",
                            rightValue: {
                                type: "value",
                                storageType: "params",
                                storageOperationType: "get",
                                key: 0,
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "generals_location",
                            },
                        },
                        then: {
                            labelToOpen: {
                                label: "general_conversation",
                                type: "call",
                                params: undefined,
                            },
                            glueEnabled: undefined,
                        },
                    },
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: "==",
                            rightValue: {
                                type: "value",
                                storageType: "params",
                                storageOperationType: "get",
                                key: 0,
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "doctors_location",
                            },
                        },
                        then: {
                            labelToOpen: {
                                label: "doctor_conversation",
                                type: "call",
                                params: undefined,
                            },
                            glueEnabled: undefined,
                        },
                    },
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            "general_conversation_|_c-0": [
                {
                    dialogue: '"It\'s a bad business, I can tell you."',
                },
                {
                    labelToOpen: {
                        label: "general_conversation_|_g-0",
                        type: "call",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            "general_conversation_|_g-0": [
                {
                    labelToOpen: {
                        label: "run_player_location",
                        type: "jump",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            general_conversation: [
                {
                    choices: [
                        {
                            text: "Ask the General about the bloodied knife",
                            label: "general_conversation_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "doctor_conversation_|_c-0": [
                {
                    dialogue: '"There\'s nothing strange about blood, is there?"',
                },
                {
                    labelToOpen: {
                        label: "doctor_conversation_|_g-0",
                        type: "call",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            "doctor_conversation_|_g-0": [
                {
                    labelToOpen: {
                        label: "run_player_location",
                        type: "jump",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            doctor_conversation: [
                {
                    choices: [
                        {
                            text: "Ask the Doctor about the bloodied knife",
                            label: "doctor_conversation_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
        },
    };
    let res = convertInkToJson(`
CONST HALLWAY = 1
CONST OFFICE = 2

VAR player_location = HALLWAY
VAR generals_location = HALLWAY
VAR doctors_location = OFFICE

== run_player_location
	{
		- player_location == HALLWAY: -> hallway
	}

== hallway ==
	<- characters_present(HALLWAY)
	*	[Drawers]	-> examine_drawers
	* 	[Wardrobe] -> examine_wardrobe
	*  [Go to Office] 	-> go_office
	-	-> run_player_location
= examine_drawers
	->DONE

// Here's the thread, which mixes in dialogue for characters you share the room with at the moment.

== characters_present(room)
	{ generals_location == room:
		<- general_conversation
	}
	{ doctors_location == room:
		<- doctor_conversation
	}
	-> DONE

== general_conversation
	*	[Ask the General about the bloodied knife]
		"It's a bad business, I can tell you."
	-	-> run_player_location

== doctor_conversation
	*	[Ask the Doctor about the bloodied knife]
		"There's nothing strange about blood, is there?"
	-	-> run_player_location
`);
    expect(res).toEqual(expected);
});
