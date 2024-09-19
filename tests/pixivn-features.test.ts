import { CharacterBaseModel, PixiVNJson, saveCharacter } from '@drincs/pixi-vn';
import { expect, test } from 'vitest';
import { convertInkText } from '../src/functions';

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
    let expected: PixiVNJson = {
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
                },
                {
                    operation: [
                        {
                            type: "image",
                            operationType: "show",
                            alias: "bg 2",
                            url: "/image2.png",
                        },
                    ],
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
#show image bg /image.png
# show image "bg 2" /image2.png
# show image  bg /image.png dissolve
#show image bg /image.png  dissolve duration 3
hello
-> DONE
`);
    expect(res).toEqual(expected);
});
