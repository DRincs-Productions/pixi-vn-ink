import { PixiVNJson } from '@drincs/pixi-vn';
import { expect, test } from 'vitest';
import { convertInkText } from '../src/functions';

/**
 * 1) Global Variables
 */

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#defining-global-variables
 */
test('Defining Global Variables', async () => {
    let expected: PixiVNJson = {
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "knowledge_of_the_cure",
                value: false,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "players_name",
                value: "Emilia",
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "number_of_infected_people",
                value: 521,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "current_epilogue",
                value: "they_all_die_of_the_plague",
            },
        ],
        labels: {
            they_all_die_of_the_plague: [
                {
                    end: "label_end",
                },
            ],
        }
    }
    let res = convertInkText(`
VAR knowledge_of_the_cure = false
VAR players_name = "Emilia"
VAR number_of_infected_people = 521
VAR current_epilogue = -> they_all_die_of_the_plague

=== they_all_die_of_the_plague
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#advanced-storing-diverts-as-variables
 */
test('Advanced: storing diverts as variables', async () => {
    let expected: PixiVNJson = {
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "current_epilogue",
                value: "everybody_dies",
            },
        ],
        labels: {
            "continue_or_quit_|_c-0": [
                {
                    dialogue: " \t",
                    goNextStep: true,
                },
                {
                    labelToOpen: {
                        label: "more_hopeless_introspection",
                        type: "call",
                    },
                    glueEnabled: true,
                },
            ],
            "continue_or_quit_|_c-1": [
                {
                    dialogue: " \t\t",
                    goNextStep: true,
                },
                {
                    labelToOpen: {
                        label: {
                            type: "value",
                            storageOperationType: "get",
                            storageType: "storage",
                            key: "current_epilogue",
                        },
                        type: "call",
                    },
                    glueEnabled: true,
                },
            ],
            continue_or_quit: [
                {
                    dialogue: "Give up now, or keep trying to save your Kingdom?",
                },
                {
                    choices: [
                        {
                            text: "Keep trying!",
                            label: "continue_or_quit_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "Give up",
                            label: "continue_or_quit_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            everybody_dies: [
                {
                    end: "label_end",
                },
            ],
            more_hopeless_introspection: [
                {
                    end: "label_end",
                },
            ],
        }
    }
    let res = convertInkText(`
VAR current_epilogue = -> everybody_dies

=== continue_or_quit ===
Give up now, or keep trying to save your Kingdom?
*  [Keep trying!] 	-> more_hopeless_introspection
*  [Give up] 		-> current_epilogue

=== everybody_dies ===
-> DONE
=== more_hopeless_introspection ===
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#printing-variables
 */
test('Printing variables', async () => {
    let expected: PixiVNJson = {
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "friendly_name_of_player",
                value: "Jackie",
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "age",
                value: 23,
            },
        ],
        labels: {
            start: [
                {
                    dialogue: "My name is Jean Passepartout, but my friends call me ",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: {
                        type: "value",
                        storageType: "storage",
                        storageOperationType: "get",
                        key: "friendly_name_of_player",
                    },
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: ". I'm ",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: {
                        type: "value",
                        storageType: "storage",
                        storageOperationType: "get",
                        key: "age",
                    },
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " years old.",
                },
                {
                    end: "label_end",
                },
            ],
        }
    }
    let res = convertInkText(`
VAR friendly_name_of_player = "Jackie"
VAR age = 23

=== start ===
My name is Jean Passepartout, but my friends call me {friendly_name_of_player}. I'm {age} years old.
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#evaluating-strings
 */
test('Evaluating strings', async () => {
    let expected: PixiVNJson = {
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "a_colour",
                value: "",
            },
            {
                type: "value",
                value: {
                    type: "stepswitch",
                    elements: [
                        "red",
                        "blue",
                        "green",
                        "yellow",
                    ],
                    choiceType: "random",
                },
                key: "a_colour",
                storageType: "storage",
                storageOperationType: "set",
            },
        ],
        labels: {
            "start_|_c-0": [
                {
                    labelToOpen: {
                        label: "start",
                        type: "call",
                    },
                },
            ],
            start: [
                {
                    dialogue: {
                        type: "value",
                        storageType: "storage",
                        storageOperationType: "get",
                        key: "a_colour",
                    },
                },
                {
                    choices: [
                        {
                            text: "restart",
                            label: "start_|_c-0",
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
VAR a_colour = ""

~ a_colour = "{~red|blue|green|yellow}"

-> start
=== start ===
{a_colour}
+ [restart] -> start
`);
    expect(res).toEqual(expected);
});

/**
 * 2) Logic
 */

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#2-logic
 */
test('Logic', async () => {
    let expected: PixiVNJson = {
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "y",
                value: 2,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "x",
                value: 3,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "c",
                value: 1,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "knows_about_wager",
                value: false,
            },
        ],
        labels: {
            set_some_variables: [
                {
                    goNextStep: true,
                    operation: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "knows_about_wager",
                            value: true,
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operation: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "x",
                            value: {
                                type: "value",
                                storageType: "logic",
                                storageOperationType: "get",
                                operation: {
                                    type: "arithmetic",
                                    operator: "+",
                                    rightValue: {
                                        type: "value",
                                        storageType: "storage",
                                        storageOperationType: "get",
                                        key: "c",
                                    },
                                    leftValue: {
                                        type: "arithmetic",
                                        operator: "-",
                                        rightValue: {
                                            type: "arithmetic",
                                            operator: "*",
                                            rightValue: {
                                                type: "value",
                                                storageType: "storage",
                                                storageOperationType: "get",
                                                key: "y",
                                            },
                                            leftValue: {
                                                type: "value",
                                                storageType: "storage",
                                                storageOperationType: "get",
                                                key: "y",
                                            },
                                        },
                                        leftValue: {
                                            type: "arithmetic",
                                            operator: "*",
                                            rightValue: {
                                                type: "value",
                                                storageType: "storage",
                                                storageOperationType: "get",
                                                key: "x",
                                            },
                                            leftValue: {
                                                type: "value",
                                                storageType: "storage",
                                                storageOperationType: "get",
                                                key: "x",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operation: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "y",
                            value: {
                                type: "value",
                                storageType: "logic",
                                storageOperationType: "get",
                                operation: {
                                    type: "arithmetic",
                                    operator: "*",
                                    rightValue: {
                                        type: "value",
                                        storageType: "storage",
                                        storageOperationType: "get",
                                        key: "y",
                                    },
                                    leftValue: {
                                        type: "arithmetic",
                                        operator: "*",
                                        rightValue: {
                                            type: "value",
                                            storageType: "storage",
                                            storageOperationType: "get",
                                            key: "x",
                                        },
                                        leftValue: 2,
                                    },
                                },
                            },
                        },
                    ],
                },
                {
                    end: "label_end",
                },
            ],
        }
    }
    let res = convertInkText(`
VAR y = 2
VAR x = 3
VAR c = 1
VAR knows_about_wager = false
-> set_some_variables
=== set_some_variables ===
	~ knows_about_wager = true
	~ x = (x * x) - (y * y) + c
	~ y = 2 * x * y
	-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#mathematics
 */
test('Mathematics', async () => {
    let expected: PixiVNJson = {
        labels: {
            start: [
                {
                    dialogue: {
                        type: "value",
                        storageType: "logic",
                        storageOperationType: "get",
                        operation: {
                            type: "arithmetic",
                            operator: "POW",
                            rightValue: 2,
                            leftValue: 3,
                        },
                    },
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " is 9.",
                },
                {
                    dialogue: {
                        type: "value",
                        storageType: "logic",
                        storageOperationType: "get",
                        operation: {
                            type: "arithmetic",
                            operator: "POW",
                            rightValue: 0.5,
                            leftValue: 16,
                        },
                    },
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " is 4.",
                },
                {
                    end: "label_end",
                },
            ],
        }
    }
    let res = convertInkText(`
=== start
{POW(3, 2)} is 9.
{POW(16, 0.5)} is 4.
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#randommin-max
 */
test('RANDOM(min, max)', async () => {
    let expected: PixiVNJson = {
        labels: {
            start: [
                {
                    goNextStep: true,
                    operation: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "tempstorage",
                            key: "dice_roll",
                            value: {
                                type: "value",
                                storageType: "logic",
                                storageOperationType: "get",
                                operation: {
                                    type: "arithmetic",
                                    operator: "RANDOM",
                                    rightValue: 6,
                                    leftValue: 1,
                                },
                            },
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operation: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "tempstorage",
                            key: "lazy_grading_for_test_paper",
                            value: {
                                type: "value",
                                storageType: "logic",
                                storageOperationType: "get",
                                operation: {
                                    type: "arithmetic",
                                    operator: "RANDOM",
                                    rightValue: 75,
                                    leftValue: 30,
                                },
                            },
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operation: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "tempstorage",
                            key: "number_of_heads_the_serpent_has",
                            value: {
                                type: "value",
                                storageType: "logic",
                                storageOperationType: "get",
                                operation: {
                                    type: "arithmetic",
                                    operator: "RANDOM",
                                    rightValue: 8,
                                    leftValue: 3,
                                },
                            },
                        },
                    ],
                },
            ],
        }
    }
    let res = convertInkText(`
-> start
=== start ===
~ temp dice_roll = RANDOM(1, 6)

~ temp lazy_grading_for_test_paper = RANDOM(30, 75)

~ temp number_of_heads_the_serpent_has = RANDOM(3, 8)
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#advanced-numerical-types-are-implicit
 */
test('Advanced: numerical types are implicit', async () => {
    let expected: PixiVNJson = {
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "x",
                value: 0,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "y",
                value: 0,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "z",
                value: 0,
            },
        ],
        labels: {
            start: [
                {
                    goNextStep: true,
                    operation: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "x",
                            value: {
                                type: "value",
                                storageType: "logic",
                                storageOperationType: "get",
                                operation: {
                                    type: "arithmetic",
                                    operator: "/",
                                    rightValue: 3,
                                    leftValue: 2,
                                },
                            },
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operation: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "y",
                            value: {
                                type: "value",
                                storageType: "logic",
                                storageOperationType: "get",
                                operation: {
                                    type: "arithmetic",
                                    operator: "/",
                                    rightValue: 3,
                                    leftValue: 7,
                                },
                            },
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operation: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "z",
                            value: {
                                type: "value",
                                storageType: "logic",
                                storageOperationType: "get",
                                operation: {
                                    type: "arithmetic",
                                    operator: "/",
                                    rightValue: 0.5,
                                    leftValue: 1.2,
                                },
                            },
                        },
                    ],
                },
            ],
        }
    }
    let res = convertInkText(`
VAR x = 0
VAR y = 0
VAR z = 0
-> start
=== start ===
~ x = 2 / 3
~ y = 7 / 3
~ z = 1.2 / 0.5
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#advanced-int-floor-and-float
 */
test('Advanced: INT(), FLOOR() and FLOAT()', async () => {
    let expected: PixiVNJson = {
        labels: {
            start: [
                {
                    dialogue: {
                        type: "value",
                        storageType: "logic",
                        storageOperationType: "get",
                        operation: {
                            type: "arithmeticsingle",
                            operator: "INT",
                            leftValue: 3.2,
                        },
                    },
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " is 3.",
                },
                {
                    dialogue: {
                        type: "value",
                        storageType: "logic",
                        storageOperationType: "get",
                        operation: {
                            type: "arithmeticsingle",
                            operator: "FLOOR",
                            leftValue: 4.8,
                        },
                    },
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " is 4.",
                },
                {
                    dialogue: {
                        type: "value",
                        storageType: "logic",
                        storageOperationType: "get",
                        operation: {
                            type: "arithmeticsingle",
                            operator: "INT",
                            leftValue: -4.8,
                        },
                    },
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " is -4.",
                },
                {
                    dialogue: {
                        type: "value",
                        storageType: "logic",
                        storageOperationType: "get",
                        operation: {
                            type: "arithmeticsingle",
                            operator: "FLOOR",
                            leftValue: -4.8,
                        },
                    },
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " is -5.",
                },
                {
                    dialogue: {
                        type: "value",
                        storageType: "logic",
                        storageOperationType: "get",
                        operation: {
                            type: "arithmeticsingle",
                            operator: "FLOAT",
                            leftValue: 4,
                        },
                    },
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: " is, um, still 4.",
                },
            ],
        }
    }
    let res = convertInkText(`
-> start
=== start ===
{INT(3.2)} is 3.
{FLOOR(4.8)} is 4.
{INT(-4.8)} is -4.
{FLOOR(-4.8)} is -5.

{FLOAT(4)} is, um, still 4.
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#string-queries
 */
test('String queries', async () => {
    let expected: PixiVNJson = {
        labels: {
            start: [
                {
                    dialogue: {
                        type: "value",
                        storageType: "logic",
                        storageOperationType: "get",
                        operation: {
                            type: "compare",
                            operator: "==",
                            leftValue: "Yes, please.",
                            rightValue: "Yes, please.",
                        },
                    },
                },
                {
                    dialogue: {
                        type: "value",
                        storageType: "logic",
                        storageOperationType: "get",
                        operation: {
                            type: "compare",
                            operator: "!=",
                            leftValue: "Yes, please.",
                            rightValue: "No, thank you.",
                        },
                    },
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "union",
                            unionType: "or",
                            conditions: [
                                {
                                    type: "compare",
                                    operator: "!=",
                                    leftValue: "Yes, please.",
                                    rightValue: "No, thank you.",
                                },
                                true,
                            ],
                        },
                        then: {
                            dialogue: " a b ",
                        },
                        else: undefined,
                    },
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: "CONTAINS",
                            leftValue: "ease",
                            rightValue: "Yes, please",
                        },
                        then: {
                            dialogue: " \"then\" ",
                        },
                        else: undefined,
                    },
                },
                {
                    end: "label_end",
                },
            ],
        }
    }
    let res = convertInkText(`
-> start
=== start ===
{ "Yes, please." == "Yes, please." }
{ "No, thank you." != "Yes, please." }
{ "No, thank you." != "Yes, please." || true : a b }
{ "Yes, please" ? "ease" : "then" }
->DONE
`);
    expect(res).toEqual(expected);
});

/**
 * 3) Conditional blocks (if/else)
 */

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#a-simple-if
 */
test('A simple if', async () => {
    let expected: PixiVNJson = {
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "x",
                value: 0,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "y",
                value: 0,
            },
        ],
        labels: {
            start: [
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: ">",
                            rightValue: 0,
                            leftValue: {
                                type: "value",
                                storageType: "storage",
                                storageOperationType: "get",
                                key: "x",
                            },
                        },
                        then: {
                            goNextStep: true,
                            operation: [
                                {
                                    type: "value",
                                    storageOperationType: "set",
                                    storageType: "storage",
                                    key: "y",
                                    value: {
                                        type: "value",
                                        storageType: "logic",
                                        storageOperationType: "get",
                                        operation: {
                                            type: "arithmetic",
                                            operator: "-",
                                            rightValue: 1,
                                            leftValue: {
                                                type: "value",
                                                storageType: "storage",
                                                storageOperationType: "get",
                                                key: "x",
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                        else: undefined,
                    },
                },
            ],
        }
    }
    let res = convertInkText(`
VAR x = 0
VAR y = 0
-> start
=== start
{ x > 0:
	~ y = x - 1
}
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#a-simple-if
 */
test('A simple else', async () => {
    let expected: PixiVNJson = {
        initialOperations: [],
        labels: {}
    }
    let res = convertInkText(`
{ x > 0:
	~ y = x - 1
- else:
	~ y = x + 1
}
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#extended-ifelse-ifelse-blocks
 */
test('Extended if/else if/else blocks', async () => {
    let expected: PixiVNJson = {
        initialOperations: [],
        labels: {}
    }
    let res = convertInkText(`
{
	- x == 0:
		~ y = 0
	- x > 0:
		~ y = x - 1
	- else:
		~ y = x + 1
}
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#switch-blocks
 */
test('Switch blocks', async () => {
    let expected: PixiVNJson = {
        initialOperations: [],
        labels: {}
    }
    let res = convertInkText(`
{ x:
- 0: 	zero
- 1: 	one
- 2: 	two
- else: lots
}
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#example-context-relevant-content
 */
test('Example: context-relevant content', async () => {
    let expected: PixiVNJson = {
        initialOperations: [],
        labels: {}
    }
    let res = convertInkText(`
=== dream ===
	{
		- visited_snakes && not dream_about_snakes:
			~ fear++
			-> dream_about_snakes

		- visited_poland && not dream_about_polish_beer:
			~ fear--
			-> dream_about_polish_beer

		- else:
			// breakfast-based dreams have no effect
			-> dream_about_marmalade
	}
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#conditional-blocks-are-not-limited-to-logic
 */
test('Conditional blocks are not limited to logic', async () => {
    let expected: PixiVNJson = {
        initialOperations: [],
        labels: {}
    }
    let res = convertInkText(`
I stared at Monsieur Fogg.
{ know_about_wager:
	<> "But surely you are not serious?" I demanded.
- else:
	<> "But there must be a reason for this trip," I observed.
}
He said nothing in reply, merely considering his newspaper with as much thoroughness as entomologist considering his latest pinned addition.
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#conditional-blocks-are-not-limited-to-logic
 */
test('Conditional blocks are not limited to logic 2', async () => {
    let expected: PixiVNJson = {
        initialOperations: [],
        labels: {}
    }
    let res = convertInkText(`
{ door_open:
	* 	I strode out of the compartment[] and I fancied I heard my master quietly tutting to himself. 			-> go_outside
- else:
	*	I asked permission to leave[] and Monsieur Fogg looked surprised. 	-> open_door
	* 	I stood and went to open the door[]. Monsieur Fogg seemed untroubled by this small rebellion. -> open_door
}
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#multiline-blocks
 */
test('Multiline blocks', async () => {
    let expected: PixiVNJson = {
        initialOperations: [],
        labels: {}
    }
    let res = convertInkText(`
// Sequence: go through the alternatives, and stick on last
{ stopping:
	-	I entered the casino.
	-  I entered the casino again.
	-  Once more, I went inside.
}

// Shuffle: show one at random
At the table, I drew a card. <>
{ shuffle:
	- 	Ace of Hearts.
	- 	King of Spades.
	- 	2 of Diamonds.
		'You lose this time!' crowed the croupier.
}

// Cycle: show each in turn, and then cycle
{ cycle:
	- I held my breath.
	- I waited impatiently.
	- I paused.
}

// Once: show each, once, in turn, until all have been shown
{ once:
	- Would my luck hold?
	- Could I win the hand?
}
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#advanced-modified-shuffles
 */
test('Advanced: modified shuffles', async () => {
    let expected: PixiVNJson = {
        initialOperations: [],
        labels: {}
    }
    let res = convertInkText(`
{ shuffle once:
-	The sun was hot.
- 	It was a hot day.
}
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#advanced-modified-shuffles
 */
test('Advanced: modified shuffles 2', async () => {
    let expected: PixiVNJson = {
        initialOperations: [],
        labels: {}
    }
    let res = convertInkText(`
{ shuffle stopping:
- 	A silver BMW roars past.
-	A bright yellow Mustang takes the turn.
- 	There are like, cars, here.
}
`);
    expect(res).toEqual(expected);
});

/**
 * 4) Temporary Variables
 */

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#temporary-variables-are-for-scratch-calculations
 */
test('Temporary variables are for scratch calculations', async () => {
    let expected: PixiVNJson = {
        initialOperations: [],
        labels: {}
    }
    let res = convertInkText(`
=== near_north_pole ===
	~ temp number_of_warm_things = 0
	{ blanket:
		~ number_of_warm_things++
	}
	{ ear_muffs:
		~ number_of_warm_things++
	}
	{ gloves:
		~ number_of_warm_things++
	}
	{ number_of_warm_things > 2:
		Despite the snow, I felt incorrigibly snug.
	- else:
		That night I was colder than I have ever been.
	}
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#knots-and-stitches-can-take-parameters
 */
test('Knots and stitches can take parameters', async () => {
    let expected: PixiVNJson = {
        initialOperations: [],
        labels: {}
    }
    let res = convertInkText(`
*	[Accuse Hasting]
		-> accuse("Hastings")
*	[Accuse Mrs Black]
		-> accuse("Claudia")
*	[Accuse myself]
		-> accuse("myself")

=== accuse(who) ===
	"I accuse {who}!" Poirot declared.
	"Really?" Japp replied. "{who == "myself":You did it?|{who}?}"
	"And why not?" Poirot shot back.
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#example-a-recursive-knot-definition
 */
test('Example: a recursive knot definition', async () => {
    let expected: PixiVNJson = {
        initialOperations: [],
        labels: {}
    }
    let res = convertInkText(`
-> add_one_to_one_hundred(0, 1)

=== add_one_to_one_hundred(total, x) ===
	~ total = total + x
	{ x == 100:
		-> finished(total)
	- else:
		-> add_one_to_one_hundred(total, x + 1)
	}

=== finished(total) ===
	"The result is {total}!" you announce.
	Gauss stares at you in horror.
	-> END
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#advanced-sending-divert-targets-as-parameters
 */
test('Advanced: sending divert targets as parameters', async () => {
    let expected: PixiVNJson = {
        initialOperations: [],
        labels: {}
    }
    let res = convertInkText(`
=== sleeping_in_hut ===
	You lie down and close your eyes.
	-> generic_sleep (-> waking_in_the_hut)

===	 generic_sleep (-> waking)
	You sleep perchance to dream etc. etc.
	-> waking

=== waking_in_the_hut
	You get back to your feet, ready to continue your journey.
`);
    expect(res).toEqual(expected);
});

/**
 * 6) Constants
 */

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#global-constants
 */
test('Global Constants', async () => {
    let expected: PixiVNJson = {
        initialOperations: [],
        labels: {}
    }
    let res = convertInkText(`
CONST HASTINGS = "Hastings"
CONST POIROT = "Poirot"
CONST JAPP = "Japp"

VAR current_chief_suspect = HASTINGS

=== review_evidence ===
	{ found_japps_bloodied_glove:
		~ current_chief_suspect = POIROT
	}
	Current Suspect: {current_chief_suspect}
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#global-constants
 */
test('Global Constants 2', async () => {
    let expected: PixiVNJson = {
        initialOperations: [],
        labels: {}
    }
    let res = convertInkText(`
CONST LOBBY = 1
CONST STAIRCASE = 2
CONST HALLWAY = 3

CONST HELD_BY_AGENT = -1

VAR secret_agent_location = LOBBY
VAR suitcase_location = HALLWAY

=== report_progress ===
{
    -  secret_agent_location == suitcase_location:
	The secret agent grabs the suitcase!
	~ suitcase_location = HELD_BY_AGENT

-  secret_agent_location < suitcase_location:
	The secret agent moves forward.
	~ secret_agent_location++
}
`);
    expect(res).toEqual(expected);
});
