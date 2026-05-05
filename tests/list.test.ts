import { convertInkToJson } from "@/loader";
import { PIXIVNJSON_SCHEMA_URL, type PixiVNJson } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";

test("LIST 1", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "rango",
                value: [1, 2, 3, 4],
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "rango.recluta",
                value: 1,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "rango.soldato",
                value: 2,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "rango.capitano",
                value: 3,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "rango.generale",
                value: 4,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "grado",
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
                            key: "grado",
                            value: {
                                type: "arithmetic",
                                operator: "+",
                                rightValue: 1,
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "grado",
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
                            key: "grado",
                            value: {
                                type: "arithmetic",
                                operator: "+",
                                rightValue: 2,
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "grado",
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
                            key: "grado",
                            value: {
                                type: "arithmetic",
                                operator: "-",
                                rightValue: 1,
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "grado",
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
                            operator: ">=",
                            rightValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "rango.capitano",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "grado",
                            },
                        },
                        then: {
                            dialogue: "Accesso alto livello",
                        },
                        else: {
                            dialogue: "Accesso base",
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
                                key: "rango.soldato",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "rango.generale",
                            },
                        },
                        then: {
                            dialogue: "Ordine corretto",
                        },
                    },
                },
            ],
        },
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
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "abilita",
                value: [1, 2, 3, 4],
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "abilita.forza",
                value: 1,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "abilita.agilita",
                value: 2,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "abilita.intelligenza",
                value: 3,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "abilita.fortuna",
                value: 4,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "primeNumbers",
                value: [2, 3, 5],
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "primeNumbers.two",
                value: 2,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "primeNumbers.three",
                value: 3,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "primeNumbers.five",
                value: 5,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "Bernard",
                value: 2,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "Cartwright",
                value: 3,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "Denver",
                value: 4,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "Eamonn",
                value: 5,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "DoctorsInSurgery",
                value: [1, 2, 3, 4, 5],
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "DoctorsInSurgery.Adams",
                value: 1,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "DoctorsInSurgery.Bernard",
                value: 2,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "DoctorsInSurgery.Cartwright",
                value: 3,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "DoctorsInSurgery.Denver",
                value: 4,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "DoctorsInSurgery.Eamonn",
                value: 5,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "two2",
                value: 2,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "three2",
                value: 3,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "five2",
                value: 5,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "primeNumbers2",
                value: [2, 3, 5],
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "primeNumbers2.two2",
                value: 2,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "primeNumbers2.three2",
                value: 3,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "primeNumbers2.five2",
                value: 5,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "skill",
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
                            key: "skill",
                            value: {
                                type: "arithmetic",
                                operator: "+",
                                rightValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "abilita.forza",
                                },
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "skill",
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
                            key: "skill",
                            value: {
                                type: "arithmetic",
                                operator: "+",
                                rightValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "abilita.agilita",
                                },
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "skill",
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
                            key: "skill",
                            value: [],
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
                            key: "skill",
                            value: [1, 2, 5],
                        },
                    ],
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "value",
                            storageOperationType: "get",
                            storageType: "storage",
                            key: "DoctorsInSurgery",
                        },
                        then: {
                            dialogue: " The surgery is open today. ",
                        },
                        else: {
                            dialogue: " Everyone has gone home. ",
                        },
                    },
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: "==",
                            rightValue: [1, 2],
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "DoctorsInSurgery",
                            },
                        },
                        then: {
                            dialogue:
                                "Dr Adams and Dr Bernard are having a loud argument in one corner.",
                        },
                    },
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: "!=",
                            rightValue: [1, 2],
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "DoctorsInSurgery",
                            },
                        },
                        then: {
                            dialogue: "At least Adams and Bernard aren't arguing.",
                        },
                    },
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: "CONTAINS",
                            rightValue: [1, 2],
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "DoctorsInSurgery",
                            },
                        },
                        then: {
                            dialogue:
                                "Dr Adams and Dr Bernard are having a hushed argument in one corner.",
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
                                key: "Eamonn",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "DoctorsInSurgery",
                            },
                        },
                        then: {
                            dialogue: "Dr Eamonn is polishing his glasses.",
                        },
                    },
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "union",
                            unionType: "not",
                            condition: {
                                type: "compare",
                                operator: "CONTAINS",
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "DoctorsInSurgery",
                                },
                                rightValue: [1, 2],
                            },
                        },
                        then: {
                            dialogue:
                                "Dr Adams and Dr Bernard are having a hushed argument in one corner.",
                        },
                    },
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "union",
                            unionType: "not",
                            condition: {
                                type: "compare",
                                operator: "CONTAINS",
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "DoctorsInSurgery",
                                },
                                rightValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "Eamonn",
                                },
                            },
                        },
                        then: {
                            dialogue: "Dr Eamonn is polishing his glasses.",
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
                            key: "myList",
                            value: {
                                type: "value",
                                storageType: "logic",
                                storageOperationType: "get",
                                operation: {
                                    type: "function",
                                    functionName: "ValueList",
                                    args: [],
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
                                key: "abilita.forza",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "skill",
                            },
                        },
                        then: {
                            dialogue: "Hai forza",
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
                            key: "skill",
                            value: {
                                type: "arithmetic",
                                operator: "-",
                                rightValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "abilita.forza",
                                },
                                leftValue: {
                                    type: "value",
                                    storageOperationType: "get",
                                    storageType: "storage",
                                    key: "skill",
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
                                key: "abilita.forza",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "skill",
                            },
                        },
                        then: {
                            dialogue: "Ancora forza",
                        },
                        else: {
                            dialogue: "Forza rimossa",
                        },
                    },
                },
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "value",
                            storageOperationType: "get",
                            storageType: "storage",
                            key: "skill",
                        },
                        then: {
                            dialogue: "Lista non vuota",
                        },
                    },
                },
            ],
        },
    };
    const res = convertInkToJson(`
LIST abilita = forza, agilita, intelligenza, fortuna
LIST primeNumbers = two = 2, three = 3, five = 5
LIST DoctorsInSurgery = Adams, (Bernard), (Cartwright), (Denver), (Eamonn)
LIST primeNumbers2 = (two2 = 2), (three2) = 3, (five2 = 5)

VAR skill = ()

=== start ===
~ skill += abilita.forza
~ skill += abilita.agilita
~ skill = ()
~ skill = (Adams, Bernard, Eamonn)

{ DoctorsInSurgery: The surgery is open today. | Everyone has gone home. }
{ DoctorsInSurgery == (Adams, Bernard):
	Dr Adams and Dr Bernard are having a loud argument in one corner.
}
{ DoctorsInSurgery != (Adams, Bernard):
	At least Adams and Bernard aren't arguing.
}
{ DoctorsInSurgery ? (Adams, Bernard):
	Dr Adams and Dr Bernard are having a hushed argument in one corner.
}
{ DoctorsInSurgery has Eamonn:
	Dr Eamonn is polishing his glasses.
}
{ DoctorsInSurgery !? (Adams, Bernard):
	Dr Adams and Dr Bernard are having a hushed argument in one corner.
}
{ DoctorsInSurgery hasnt Eamonn:
	Dr Eamonn is polishing his glasses.
}
~ myList = ValueList()
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
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "a",
                value: [1, 2, 3],
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "a.uno",
                value: 1,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "a.due",
                value: 2,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "a.tre",
                value: 3,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "b",
                value: [1, 2, 3],
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "b.due",
                value: 1,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "b.tre",
                value: 2,
            },
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "b.quattro",
                value: 3,
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
                            storageType: "tempstorage",
                            key: "unione",
                            value: {
                                type: "value",
                                storageType: "logic",
                                storageOperationType: "get",
                                operation: {
                                    type: "arithmetic",
                                    operator: "+",
                                    rightValue: {
                                        type: "value",
                                        storageOperationType: "get",
                                        storageType: "storage",
                                        key: "b",
                                    },
                                    leftValue: {
                                        type: "value",
                                        storageOperationType: "get",
                                        storageType: "storage",
                                        key: "a",
                                    },
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
                            storageType: "tempstorage",
                            key: "intersezione",
                            value: {
                                type: "value",
                                storageType: "logic",
                                storageOperationType: "get",
                                operation: {
                                    type: "arithmetic",
                                    operator: "INTERSECTION",
                                    rightValue: {
                                        type: "value",
                                        storageOperationType: "get",
                                        storageType: "storage",
                                        key: "b",
                                    },
                                    leftValue: {
                                        type: "value",
                                        storageOperationType: "get",
                                        storageType: "storage",
                                        key: "a",
                                    },
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
                            storageType: "tempstorage",
                            key: "differenza",
                            value: {
                                type: "value",
                                storageType: "logic",
                                storageOperationType: "get",
                                operation: {
                                    type: "arithmetic",
                                    operator: "-",
                                    rightValue: {
                                        type: "value",
                                        storageOperationType: "get",
                                        storageType: "storage",
                                        key: "b",
                                    },
                                    leftValue: {
                                        type: "value",
                                        storageOperationType: "get",
                                        storageType: "storage",
                                        key: "a",
                                    },
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
                                key: "a.due",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "intersezione",
                            },
                        },
                        then: {
                            dialogue: "Due è in comune",
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
                                key: "a.uno",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "differenza",
                            },
                        },
                        then: {
                            dialogue: "Uno è solo in a",
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
                                key: "b.quattro",
                            },
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "unione",
                            },
                        },
                        then: {
                            dialogue: "Quattro incluso",
                        },
                    },
                },
            ],
        },
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
