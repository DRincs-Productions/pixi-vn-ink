import { convertInkToJson } from "@/loader";
import { PIXIVNJSON_SCHEMA_URL, type PixiVNJson } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";

test("Tunnel 1", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            "city_|_c-0": [
                {
                    labelToOpen: {
                        label: "merchant_dialogue",
                        type: "call",
                        params: undefined,
                    },
                },
                {
                    dialogue: "You go back to walking around the city.",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            city: [
                {
                    dialogue: "You are in the city.",
                },
                {
                    choices: [
                        {
                            text: "Talk to the merchant",
                            label: "city_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "merchant_dialogue_|_c-0": [
                {
                    dialogue: '"Show me your goods"',
                },
                {
                    dialogue: '"Here they are!"',
                },
            ],
            "merchant_dialogue_|_c-1": [
                {
                    dialogue: '"Goodbye"',
                },
                {
                    dialogue: '"See you soon!"',
                },
            ],
            merchant_dialogue: [
                {
                    dialogue: "The merchant smiles.",
                },
                {
                    choices: [
                        {
                            text: '"Show me your goods"',
                            label: "merchant_dialogue_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: '"Goodbye"',
                            label: "merchant_dialogue_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
        },
    };
    const res = convertInkToJson(`
-> city
=== city ===
You are in the city.

* [Talk to the merchant]
    -> merchant_dialogue ->
    You go back to walking around the city.
    -> DONE

=== merchant_dialogue ===
The merchant smiles.

* "Show me your goods"
    "Here they are!"
    ->->
* "Goodbye"
    "See you soon!"
->->
`);
    expect(res).toEqual(expected);
});

test("Tunnel 2", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "reputation",
                value: 0,
            },
        ],
        labels: {
            "city_|_c-0": [
                {
                    labelToOpen: {
                        label: "guard_dialogue",
                        type: "call",
                        params: undefined,
                    },
                },
                {
                    dialogue: "You return to the square.",
                },
                {
                    labelToOpen: {
                        label: "city",
                        params: undefined,
                        type: "jump",
                    },
                },
                {
                    dialogue:
                        "You don't see this line because you are sent back to the city before.",
                },
            ],
            "city_|_c-1": [
                {
                    dialogue: "The guard helps you.",
                },
                {
                    end: "game_end",
                },
            ],
            city: [
                {
                    dialogue: "You are in the square.",
                },
                {
                    choices: [
                        {
                            text: "Talk to the guard",
                            label: "city_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            type: "ifelse",
                            condition: {
                                type: "compare",
                                operator: ">=",
                                rightValue: 1,
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "reputation",
                                },
                            },
                            then: {
                                text: "Ask for a favor",
                                label: "city_|_c-1",
                                props: {},
                                type: "call",
                                oneTime: true,
                            },
                        },
                    ],
                },
            ],
            "guard_dialogue_|_c-0": [
                {
                    dialogue: '"Hello citizen."',
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "reputation",
                            value: {
                                type: "arithmetic",
                                operator: "+",
                                rightValue: 1,
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "reputation",
                                },
                            },
                        },
                    ],
                },
            ],
            "guard_dialogue_|_c-1": [
                {
                    dialogue: '"Hey you!"',
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "reputation",
                            value: {
                                type: "arithmetic",
                                operator: "-",
                                rightValue: 1,
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "reputation",
                                },
                            },
                        },
                    ],
                },
            ],
            guard_dialogue: [
                {
                    dialogue: "The guard looks at you.",
                },
                {
                    choices: [
                        {
                            text: "Greet",
                            label: "guard_dialogue_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "Insult",
                            label: "guard_dialogue_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
        },
    };
    const res = convertInkToJson(`
VAR reputation = 0

-> city
=== city ===
You are in the square.

* [Talk to the guard]
    -> guard_dialogue ->
    You return to the square.
    -> city
    You don't see this line because you are sent back to the city before.

* {reputation >= 1} [Ask for a favor]
    The guard helps you.
    -> END

=== guard_dialogue ===
The guard looks at you.

* [Greet]
    "Hello citizen."
    ~ reputation += 1
->->

* [Insult]
    "Hey you!"
    ~ reputation -= 1

->->
`);
    expect(res).toEqual(expected);
});

test("Tunnel 3", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "items",
                value: [1, 2, 3],
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "items.sword",
                value: 1,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "items.key",
                value: 2,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "items.potion",
                value: 3,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "inventory",
                value: [],
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "sword",
                value: 1,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "key",
                value: 2,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "items",
                value: [1, 2, 3],
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "inventory2",
                value: [1, 2],
            },
        ],
        labels: {
            "house_|_c-0": [
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "inventory",
                            value: {
                                type: "arithmetic",
                                operator: "+",
                                rightValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "items.key",
                                },
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "inventory",
                                },
                            },
                        },
                    ],
                },
                {
                    dialogue: "You found a key.",
                },
            ],
            "house_|_c-1": [
                {
                    labelToOpen: {
                        label: "show_inventory",
                        type: "call",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
                {
                    dialogue: "You return to the room.",
                },
            ],
            house: [
                {
                    dialogue: "You are at home.",
                },
                {
                    choices: [
                        {
                            text: "Open the chest",
                            label: "house_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "Check inventory",
                            label: "house_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            show_inventory: [
                {
                    dialogue: "You have:",
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: "==",
                            rightValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "items.key",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "inventory",
                            },
                        },
                        then: {
                            dialogue: "A rusty key.",
                        },
                        else: {
                            conditionalStep: {
                                type: "ifelse",
                                condition: {
                                    type: "compare",
                                    operator: "==",
                                    rightValue: {
                                        type: "value",
                                        storageOperationType: "get",
                                        storageType: "storage",
                                        key: "items.sword",
                                    },
                                    leftValue: {
                                        type: "value",
                                        storageOperationType: "get",
                                        storageType: "storage",
                                        key: "inventory",
                                    },
                                },
                                then: {
                                    dialogue: "A sword.",
                                },
                                else: {
                                    conditionalStep: {
                                        type: "ifelse",
                                        condition: {
                                            type: "compare",
                                            operator: "==",
                                            rightValue: {
                                                type: "value",
                                                storageOperationType: "get",
                                                storageType: "storage",
                                                key: "items.potion",
                                            },
                                            leftValue: {
                                                type: "value",
                                                storageOperationType: "get",
                                                storageType: "storage",
                                                key: "inventory",
                                            },
                                        },
                                        then: {
                                            dialogue: "A potion.",
                                        },
                                        else: {
                                            dialogue: "Nothing.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ],
        },
    };
    const res = convertInkToJson(`
LIST items = sword, key, potion

VAR inventory = ()
VAR inventory2 = (sword, key)

=== house ===
You are at home.

* [Open the chest]
    ~ inventory += items.key
    You found a key.

* [Check inventory]
    -> show_inventory ->
    You return to the room.

=== show_inventory ===
You have:
{inventory:
    - items.key: A rusty key.
    - items.sword: A sword.
    - items.potion: A potion.
    - else: Nothing.
}
->->
`);
    expect(res).toEqual(expected);
});

test("Tunnel 4", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "player_hp",
                value: 10,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "enemy_hp",
                value: 6,
            },
        ],
        labels: {
            start: [
                {
                    dialogue: "A goblin appears!",
                },
                {
                    labelToOpen: {
                        label: "combat",
                        type: "call",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
                {
                    dialogue: "You survived.",
                },
                {
                    end: "game_end",
                },
            ],
            "combat_|_then_|_c-0": [
                {
                    labelToOpen: {
                        label: "player_attack",
                        type: "jump",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            "combat_|_then_|_c-1": [
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "player_hp",
                            value: {
                                type: "arithmetic",
                                operator: "+",
                                rightValue: 1,
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "player_hp",
                                },
                            },
                        },
                    ],
                },
                {
                    dialogue: "You brace yourself.",
                },
                {
                    labelToOpen: {
                        label: "enemy_attack",
                        type: "call",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
                {
                    labelToOpen: {
                        label: "combat",
                        type: "jump",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            combat: [
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "union",
                            unionType: "and",
                            conditions: [
                                {
                                    type: "compare",
                                    operator: ">",
                                    rightValue: 0,
                                    leftValue: {
                                        type: "value",
                                        storageOperationType: "get",
                                        storageType: "storage",
                                        key: "player_hp",
                                    },
                                },
                                {
                                    type: "compare",
                                    operator: ">",
                                    rightValue: 0,
                                    leftValue: {
                                        type: "value",
                                        storageOperationType: "get",
                                        storageType: "storage",
                                        key: "enemy_hp",
                                    },
                                },
                            ],
                        },
                        then: {
                            type: "resulttocombine",
                            combine: "cross",
                            secondConditionalItem: [
                                {
                                    dialogue: "Status: You ",
                                    glueEnabled: true,
                                    goNextStep: true,
                                },
                                {
                                    dialogue: {
                                        type: "value",
                                        storageOperationType: "get",
                                        storageType: "storage",
                                        key: "player_hp",
                                    },
                                    glueEnabled: true,
                                    goNextStep: true,
                                },
                                {
                                    dialogue: " / Enemy ",
                                    glueEnabled: true,
                                    goNextStep: true,
                                },
                                {
                                    dialogue: {
                                        type: "value",
                                        storageOperationType: "get",
                                        storageType: "storage",
                                        key: "enemy_hp",
                                    },
                                },
                                {
                                    choices: [
                                        {
                                            text: "Attack",
                                            label: "combat_|_then_|_c-0",
                                            props: {},
                                            type: "call",
                                            oneTime: true,
                                        },
                                        {
                                            text: "Defend",
                                            label: "combat_|_then_|_c-1",
                                            props: {},
                                            type: "call",
                                            oneTime: true,
                                        },
                                    ],
                                },
                            ],
                        },
                        else: {
                            conditionalStep: {
                                type: "ifelse",
                                condition: {
                                    type: "compare",
                                    operator: "<=",
                                    rightValue: 0,
                                    leftValue: {
                                        type: "value",
                                        storageOperationType: "get",
                                        storageType: "storage",
                                        key: "player_hp",
                                    },
                                },
                                then: {
                                    dialogue: "You died.",
                                },
                                else: {
                                    dialogue: "You won!",
                                },
                            },
                        },
                    },
                },
            ],
            player_attack: [
                {
                    dialogue: "You deal damage.",
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "enemy_hp",
                            value: {
                                type: "arithmetic",
                                operator: "-",
                                rightValue: 2,
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "enemy_hp",
                                },
                            },
                        },
                    ],
                },
            ],
            enemy_attack: [
                {
                    dialogue: "The enemy strikes.",
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "player_hp",
                            value: {
                                type: "arithmetic",
                                operator: "-",
                                rightValue: 2,
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "player_hp",
                                },
                            },
                        },
                    ],
                },
            ],
        },
    };
    const res = convertInkToJson(`
VAR player_hp = 10
VAR enemy_hp = 6

=== start ===
A goblin appears!
-> combat ->
You survived.
-> END

=== combat ===
{player_hp > 0 and enemy_hp > 0:
    Status: You {player_hp} / Enemy {enemy_hp}

    * [Attack]
        -> player_attack
    * [Defend]
        ~ player_hp += 1
        You brace yourself.
    
    -> enemy_attack ->
    -> combat
- else:
    {player_hp <= 0:
        You died.
    - else:
        You won!
    }
}
->->

=== player_attack ===
You deal damage.
~ enemy_hp -= 2
->->

=== enemy_attack ===
The enemy strikes.
~ player_hp -= 2
->->
`);
    expect(res).toEqual(expected);
});

test("Tunnel 5", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            "intro_|_c-0": [
                {
                    labelToOpen: {
                        label: "room",
                        type: "jump",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            intro: [
                {
                    labelToOpen: {
                        label: "dream_scene",
                        type: "call",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
                {
                    dialogue: "You wake up confused.",
                },
                {
                    choices: [
                        {
                            text: "Get up",
                            label: "intro_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "dream_scene_|_vision1_|_c-0": [
                {
                    dialogue: '"Your destiny awaits."',
                },
                {
                    labelToOpen: {
                        label: "dream_scene_|_vision2",
                        type: "jump",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
            ],
            "dream_scene_|_vision1_|_c-1": [
                {
                    dialogue: "Everything fades.",
                },
            ],
            "dream_scene_|_vision1": [
                {
                    dialogue: "A figure speaks to you.",
                },
                {
                    choices: [
                        {
                            text: "Listen",
                            label: "dream_scene_|_vision1_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                        {
                            text: "Ignore",
                            label: "dream_scene_|_vision1_|_c-1",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "dream_scene_|_vision2": [
                {
                    dialogue: "You see a door.",
                },
                {
                    choices: [
                        {
                            text: "Open it",
                            label: "dream_scene_|_vision2_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            dream_scene: [
                {
                    dialogue: "The world is distorted...",
                },
            ],
            room: [
                {
                    dialogue: "You are in your room.",
                },
                {
                    end: "game_end",
                },
            ],
        },
    };
    const res = convertInkToJson(`
=== intro ===
-> dream_scene ->
You wake up confused.

* [Get up]
    -> room

=== dream_scene ===
The world is distorted...

= vision1
A figure speaks to you.

* [Listen]
    "Your destiny awaits."
    -> vision2
* [Ignore]
    Everything fades.
    ->->

= vision2
You see a door.

* [Open it]
    ->->

=== room ===
You are in your room.
-> END
`);
    expect(res).toEqual(expected);
});

test("Tunnel 6", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "quest_active",
                value: false,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "quest_completed",
                value: false,
            },
        ],
        labels: {
            "village_|_c-0": [
                {
                    labelToOpen: {
                        label: "quest",
                        type: "call",
                        params: undefined,
                    },
                    glueEnabled: undefined,
                },
                {
                    dialogue: "You return to the village.",
                },
            ],
            village: [
                {
                    choices: [
                        {
                            text: "Talk to the chief",
                            label: "village_|_c-0",
                            props: {},
                            type: "call",
                            oneTime: true,
                        },
                    ],
                },
            ],
            "quest_|_else_|_then_|_c-0": [
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "quest_completed",
                            value: true,
                        },
                    ],
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            "quest_|_else_|_then_|_c-1": [
                {
                    dialogue: "Come back when you find it.",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            quest: [
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "value",
                            storageOperationType: "get",
                            storageType: "storage",
                            key: "quest_completed",
                        },
                        then: {
                            dialogue: '"Thank you, hero!"',
                        },
                        else: {
                            conditionalStep: {
                                type: "ifelse",
                                condition: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "quest_active",
                                },
                                then: {
                                    type: "resulttocombine",
                                    combine: "cross",
                                    secondConditionalItem: [
                                        {
                                            dialogue: '"Have you found the item?"',
                                        },
                                        {
                                            choices: [
                                                {
                                                    text: "Yes",
                                                    label: "quest_|_else_|_then_|_c-0",
                                                    props: {},
                                                    type: "call",
                                                    oneTime: true,
                                                },
                                                {
                                                    text: "No",
                                                    label: "quest_|_else_|_then_|_c-1",
                                                    props: {},
                                                    type: "call",
                                                    oneTime: true,
                                                },
                                            ],
                                        },
                                    ],
                                },
                                else: {
                                    type: "resulttocombine",
                                    combine: "cross",
                                    secondConditionalItem: [
                                        {
                                            dialogue: '"Find the relic!"',
                                        },
                                        {
                                            goNextStep: true,
                                            operations: [
                                                {
                                                    type: "value",
                                                    storageOperationType: "set",
                                                    storageType: "storage",
                                                    key: "quest_active",
                                                    value: true,
                                                },
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            ],
        },
    };
    const res = convertInkToJson(`
VAR quest_active = false
VAR quest_completed = false

=== village ===
* [Talk to the chief]
    -> quest ->
    You return to the village.

=== quest ===
{quest_completed:
    "Thank you, hero!"
- else:
    {quest_active:
        "Have you found the item?"
        * [Yes]
            ~ quest_completed = true
            -> DONE
        * [No]
            Come back when you find it.
            -> DONE
    - else:
        "Find the relic!"
        ~ quest_active = true
    }
}
->->
`);
    expect(res).toEqual(expected);
});
