import { CharacterBaseModel, PixiVNJson, saveCharacter } from '@drincs/pixi-vn';
import { expect, test } from 'vitest';
import { convertInkText } from '../src/functions';
import { getOperationFromComment } from '../src/utility/CommentUtility';

function convertOperation(res?: PixiVNJson) {
    if (res?.labels) {
        for (let label in res.labels) {
            res.labels[label] = res.labels[label].map((step) => {
                if (step.operation) {
                    step.operation = step.operation.map((operation) => {
                        if (operation.type === "oprationtoconvert") {
                            let v: string = operation.values.map((v) => {
                                if (typeof v === "string") {
                                    return v;
                                }
                                return `"${v.type}"`;
                            }).join("");
                            return getOperationFromComment(v);
                        }
                        return operation;
                    }).filter((operation) => operation !== undefined);
                }
                return step;
            });
        }
    }
}

test('Assign dialogue to a character', async () => {
    let alice = new CharacterBaseModel("alice", {
        name: "Alice"
    })
    saveCharacter(alice)
    let expected: PixiVNJson = {
        labels: {
            start: [
                {
                    dialogue: {
                        character: "alice",
                        text: "Hello, world!",
                    },
                },
                {
                    end: "label_end",
                },
            ],
        }
    }
    let res = convertInkText(`
=== start
alice: Hello, world!
-> DONE
`);
    expect(res).toEqual(expected);
});

test('show image', async () => {
    let expected1: PixiVNJson = {
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "duration",
                value: 3,
            },
        ],
        labels: {
            start: [
                {
                    operation: [
                        {
                            type: "oprationtoconvert",
                            values: [
                                "show image bg /image.png",
                            ],
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "oprationtoconvert",
                            values: [
                                "show image \"bg 2 alice\" /image2.png",
                            ],
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "oprationtoconvert",
                            values: [
                                "show image  bg /image.png dissolve",
                            ],
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "oprationtoconvert",
                            values: [
                                "show image bg /image.png  dissolve duration 3",
                            ],
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "oprationtoconvert",
                            values: [
                                "show image bg /image.png  dissolve duration ",
                                {
                                    type: "value",
                                    storageType: "storage",
                                    storageOperationType: "get",
                                    key: "duration",
                                },
                            ],
                        },
                    ],
                    goNextStep: true,
                },
                {
                    dialogue: "hello",
                },
                {
                    end: "label_end",
                },
            ],
        }
    }
    let expected2: PixiVNJson = {
        initialOperations: [
            {
                type: "value",
                storageOperationType: "set",
                storageType: "storage",
                key: "duration",
                value: 3,
            },
        ],
        labels: {
            start: [
                {
                    operation: [
                        {
                            type: "image",
                            operationType: "show",
                            alias: "bg",
                            url: "/image.png",
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "image",
                            operationType: "show",
                            alias: "bg 2 alice",
                            url: "/image2.png",
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "image",
                            operationType: "show",
                            alias: "bg",
                            url: "/image.png",
                            transition: {
                                type: "dissolve",
                            },
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "image",
                            operationType: "show",
                            alias: "bg",
                            url: "/image.png",
                            transition: {
                                type: "dissolve",
                                props: {
                                    duration: 3,
                                },
                            },
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "image",
                            operationType: "show",
                            alias: "bg",
                            url: "/image.png",
                            transition: {
                                type: "dissolve",
                                props: {
                                    duration: "value" as any,
                                },
                            },
                        },
                    ],
                    goNextStep: true,
                },
                {
                    dialogue: "hello",
                },
                {
                    end: "label_end",
                },
            ],
        }
    }
    let res = convertInkText(`
VAR duration = 3
=== start
#show image bg /image.png
# show image "bg 2 alice" /image2.png
# show image  bg /image.png dissolve
#show image bg /image.png  dissolve duration 3
#show image bg /image.png  dissolve duration {start ? duration: duration| 0 }
hello
-> DONE
`);
    expect(res).toEqual(expected1);
    convertOperation(res);
    expect(res).toEqual(expected2);
});

test('edit image', async () => {
    let expected1: PixiVNJson = {
        labels: {
            start: [
                {
                    operation: [
                        {
                            type: "oprationtoconvert",
                            values: [
                                "edit image bg position { \"x\": 20, \"y\": 30, \"test\": \"test \\} ' test\", \"test2\": \"'\" } visible true   cursor \"pointer\" alpha 0.5",
                            ],
                        },
                    ],
                    goNextStep: true,
                },
                {
                    dialogue: "hello",
                },
                {
                    end: "label_end",
                },
            ],
        }
    }
    let expected2: PixiVNJson = {
        labels: {
            start: [
                {
                    operation: [
                        {
                            type: "image",
                            operationType: "edit",
                            alias: "bg",
                            props: {
                                position: {
                                    x: 20,
                                    y: 30,
                                    test: "test } ' test",
                                    test2: "'",
                                } as any,
                                visible: true,
                                cursor: "pointer",
                                alpha: 0.5,
                            },
                        },
                    ],
                    goNextStep: true,
                },
                {
                    dialogue: "hello",
                },
                {
                    end: "label_end",
                },
            ],
        }
    }
    let res = convertInkText(`
=== start
#edit image bg position \\\{ "x": 20, "y": 30, "test": "test \\\\\\\} ' test", "test2": "'" \\\} visible true   cursor "pointer" alpha 0.5 
hello
-> DONE
`);
    expect(res).toEqual(expected1);
    convertOperation(res);
    expect(res).toEqual(expected2);
});
