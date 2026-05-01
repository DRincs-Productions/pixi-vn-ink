import type { PixiVNJson } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";
import { convertInkText } from "../src/functions";

test("Tunnel 1", async () => {
    const expected: PixiVNJson = {
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
    const res = convertInkText(`
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
                    glueEnabled: true,
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
    const res = convertInkText(`
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
        labels: {},
    };
    const res = convertInkText(`
=== main ===
You walk through the forest.
-> random_event ->
You continue your journey.
-> END

=== random_event ===
{random_event_value():
    - You encounter an animal.
    - You find a coin.
    - Nothing happens.
}
->->

=== function random_event_value ===
~ return RANDOM(0,2)
`);
    expect(res).toEqual(expected);
});

test("Tunnel 4", async () => {
    const expected: PixiVNJson = {
        labels: {},
    };
    const res = convertInkText(`
LIST items = sword, key, potion

VAR inventory = ()

=== house ===
You are at home.

* [Open the chest]
    ~ inventory += key
    You found a key.

* [Check inventory]
    -> show_inventory ->
    You return to the room.

=== show_inventory ===
You have:
{inventory:
    - key: A rusty key.
    - sword: A sword.
    - potion: A potion.
    - else: Nothing.
}
->->
`);
    expect(res).toEqual(expected);
});

test("Tunnel 5", async () => {
    const expected: PixiVNJson = {
        labels: {},
    };
    const res = convertInkText(`
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
        -> player_attack ->
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

test("Tunnel 6", async () => {
    const expected: PixiVNJson = {
        labels: {},
    };
    const res = convertInkText(`
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

test("Tunnel 7", async () => {
    const expected: PixiVNJson = {
        labels: {},
    };
    const res = convertInkText(`
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
        * [No]
            Come back when you find it.
    - else:
        "Find the relic!"
        ~ quest_active = true
    }
}
->->
`);
    expect(res).toEqual(expected);
});
