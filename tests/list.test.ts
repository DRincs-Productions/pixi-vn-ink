import { convertInkToJson } from "@/loader";
import { PIXIVNJSON_SCHEMA_URL, type PixiVNJson } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";

test("LIST 1", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        initialOperations: [],
        labels: {},
    };
    const res = convertInkToJson(`
LIST rango = recluta, soldato, capitano, generale

VAR grado = rango.recluta

=== start ===
~ grado += 1
~ grado += 2
~ grado -= 1

{grado >= rango.capitano:
    Accesso alto livello
- else:
    Accesso base
}

{rango.generale > rango.soldato:
    Ordine corretto
}
`);
    expect(res).toEqual(expected);
});

test("LIST 2", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        initialOperations: [],
        labels: {},
    };
    const res = convertInkToJson(`
LIST abilita = forza, agilita, intelligenza, fortuna

VAR skill = ()

=== start ===
~ skill += abilita.forza
~ skill += abilita.agilita

{skill ? abilita.forza:
    Hai forza
}

~ skill -= abilita.forza

{skill ? abilita.forza:
    Ancora forza
- else:
    Forza rimossa
}

{skill:
    Lista non vuota
}
`);
    expect(res).toEqual(expected);
});

test("LIST 3", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        initialOperations: [],
        labels: {},
    };
    const res = convertInkToJson(`
LIST a = uno, due, tre
LIST b = due, tre, quattro

=== start ===
~ temp unione = ( a + b)
~ temp intersezione = a ^ b
~ temp differenza = a - b

{intersezione ? a.due:
    Due è in comune
}

{differenza ? a.uno:
    Uno è solo in a
}

{unione ? b.quattro:
    Quattro incluso
}
`);
    expect(res).toEqual(expected);
});

test("LIST 4", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "flag",
                value: [1, 2, 3, 4],
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "flag.A",
                value: 1,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "flag.B",
                value: 2,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "flag.C",
                value: 3,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "flag.D",
                value: 4,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "stato2",
                value: [],
            },
        ],
        labels: {
            start: [
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "stato2",
                            value: {
                                type: "arithmetic",
                                operator: "+",
                                rightValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "flag.A",
                                },
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "stato2",
                                },
                            },
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "stato2",
                            value: {
                                type: "arithmetic",
                                operator: "+",
                                rightValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "flag.B",
                                },
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "stato2",
                                },
                            },
                        },
                    ],
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
                                key: "flag",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "stato1",
                            },
                        },
                        then: {
                            dialogue: "stato1 completo",
                        },
                    },
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: "<",
                            rightValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "stato1",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "stato2",
                            },
                        },
                        then: {
                            dialogue: "stato2 è subset",
                        },
                    },
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: ">",
                            rightValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "stato2",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "stato1",
                            },
                        },
                        then: {
                            dialogue: "stato1 è superset",
                        },
                    },
                },
            ],
        },
    };
    const res = convertInkToJson(`
LIST flag = A, B, C, D

VAR stato2 = ()

=== start ===
~ stato2 += flag.A
~ stato2 += flag.B

{stato1 == flag:
    stato1 completo
}

{stato2 < stato1:
    stato2 è subset
}

{stato1 > stato2:
    stato1 è superset
}
`);
    expect(res).toEqual(expected);
});

test("LIST 5", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "stats",
                value: [1, 2, 3],
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "stats.forza",
                value: 1,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "stats.agilita",
                value: 2,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "stats.intelligenza",
                value: 3,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "status",
                value: [1, 2, 3],
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "status.vivo",
                value: 1,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "status.morto",
                value: 2,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "status.ferito",
                value: 3,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "rank",
                value: [1, 2, 3],
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "rank.base",
                value: 1,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "rank.elite",
                value: 2,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "rank.boss",
                value: 3,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "player_stats",
                value: [],
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "player_status",
                value: 1,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "player_rank",
                value: 1,
            },
        ],
        labels: {
            start: [
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "player_stats",
                            value: {
                                type: "arithmetic",
                                operator: "+",
                                rightValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "stats.forza",
                                },
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "player_stats",
                                },
                            },
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "player_stats",
                            value: {
                                type: "arithmetic",
                                operator: "+",
                                rightValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "stats.agilita",
                                },
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "player_stats",
                                },
                            },
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "player_rank",
                            value: {
                                type: "arithmetic",
                                operator: "+",
                                rightValue: 2,
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "player_rank",
                                },
                            },
                        },
                    ],
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: "CONTAINS",
                            rightValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "stats.forza",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "player_stats",
                            },
                        },
                        then: {
                            dialogue: "Forte",
                        },
                    },
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: ">=",
                            rightValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "rank.elite",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "player_rank",
                            },
                        },
                        then: {
                            dialogue: "Nemico potente",
                        },
                    },
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "player_stats",
                            value: {
                                type: "arithmetic",
                                operator: "-",
                                rightValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "stats.forza",
                                },
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "player_stats",
                                },
                            },
                        },
                    ],
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: "CONTAINS",
                            rightValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "stats.forza",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "player_stats",
                            },
                        },
                        then: {
                            dialogue: "Ancora forte",
                        },
                        else: {
                            dialogue: "Forza persa",
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
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "status.vivo",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "player_status",
                            },
                        },
                        then: {
                            dialogue: "Player vivo",
                        },
                    },
                },
            ],
        },
    };
    const res = convertInkToJson(`
LIST stats = forza, agilita, intelligenza
LIST status = vivo, morto, ferito
LIST rank = base, elite, boss

VAR player_stats = ()
VAR player_status = status.vivo
VAR player_rank = rank.base

=== start ===
~ player_stats += stats.forza
~ player_stats += stats.agilita

~ player_rank += 2

{player_stats ? stats.forza:
    Forte
}

{player_rank >= rank.elite:
    Nemico potente
}

~ player_stats -= stats.forza

{player_stats ? stats.forza:
    Ancora forte
- else:
    Forza persa
}

{player_status == status.vivo:
    Player vivo
}
`);
    expect(res).toEqual(expected);
});

test("LIST 6", async () => {
    const res = convertInkToJson(`
=== text2 ===
~ lista += colori.rosso
~ lista += stati.rosso
~ value += stati.rosso
~ value = 1

{c == colori.rosso:
    Colore rosso ok
}

{s == stati.rosso:
    Stato rosso ok
}

{lista ? colori.rosso:
    Lista contiene colore rosso
}

{lista ? stati.rosso:
    Lista contiene stato rosso
}

{player_stats ? stats.forza:
    Forte
}
`);
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        initialOperations: [],
        labels: {
            text2: [
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "lista",
                            value: {
                                type: "arithmetic",
                                operator: "+",
                                rightValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "colori.rosso",
                                },
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "lista",
                                },
                            },
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "lista",
                            value: {
                                type: "arithmetic",
                                operator: "+",
                                rightValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "stati.rosso",
                                },
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "lista",
                                },
                            },
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "value",
                            value: {
                                type: "arithmetic",
                                operator: "+",
                                rightValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "stati.rosso",
                                },
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "value",
                                },
                            },
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "value",
                            storageOperationType: "set",
                            storageType: "storage",
                            key: "value",
                            value: 1,
                        },
                    ],
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
                                key: "colori.rosso",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "c",
                            },
                        },
                        then: {
                            dialogue: "Colore rosso ok",
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
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "stati.rosso",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "s",
                            },
                        },
                        then: {
                            dialogue: "Stato rosso ok",
                        },
                    },
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: "CONTAINS",
                            rightValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "colori.rosso",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "lista",
                            },
                        },
                        then: {
                            dialogue: "Lista contiene colore rosso",
                        },
                    },
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: "CONTAINS",
                            rightValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "stati.rosso",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "lista",
                            },
                        },
                        then: {
                            dialogue: "Lista contiene stato rosso",
                        },
                    },
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: "CONTAINS",
                            rightValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "stats.forza",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "player_stats",
                            },
                        },
                        then: {
                            dialogue: "Forte",
                        },
                    },
                },
            ],
        },
    };
    expect(res).toEqual(expected);
});
