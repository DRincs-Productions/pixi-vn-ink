import { CharacterBaseModel, saveCharacter } from '@drincs/pixi-vn';
import { PixiVNJson } from '@drincs/pixi-vn-json';
import { expect, test } from 'vitest';
import { convertInkText } from '../src/functions';
import HashtagScriptManager from '../src/managers/HashtagScriptManager';

async function convertOperation(res?: PixiVNJson) {
    if (res?.labels) {
        for (let label in res.labels) {
            let tempSteps = []
            for (let step of res.labels[label]) {
                if (step.operation) {
                    let ops = []
                    for (let operation of step.operation) {
                        if (operation.type === "oprationtoconvert") {
                            let v: string = operation.values.map((v) => {
                                if (typeof v === "string") {
                                    return v;
                                }
                                return `"${v.type}"`;
                            }).join("");
                            let res = await HashtagScriptManager.generateOrRunOperationFromHashtagScript(v, {});
                            if (res) {
                                ops.push(res);
                            }
                        }
                        else {
                            ops.push(operation);
                        }
                    }
                    step.operation = ops;
                }
                tempSteps.push(step);
            }
            res.labels[label] = tempSteps;
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
                    goNextStep: true,
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

/**
 * Image
 */

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
                                "show image  bg '/image.png' dissolve",
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
                                "show image bg `/image.png`  dissolve duration ",
                                {
                                    type: "ifelse",
                                    condition: {
                                        type: "value",
                                        storageType: "label",
                                        storageOperationType: "get",
                                        label: "start",
                                    },
                                    then: {
                                        type: "resulttocombine",
                                        combine: "cross",
                                        secondConditionalItem: [
                                            " ",
                                            {
                                                type: "value",
                                                storageType: "storage",
                                                storageOperationType: "get",
                                                key: "duration",
                                            },
                                            " ",
                                        ],
                                    },
                                    else: {
                                        type: "resulttocombine",
                                        combine: "cross",
                                        secondConditionalItem: [
                                            " ",
                                            {
                                                type: "stepswitch",
                                                elements: [
                                                    "duration",
                                                    " 0 == 0",
                                                ],
                                                choiceType: "sequential",
                                                end: "lastItem",
                                                nestedId: "else",
                                            },
                                            " ",
                                        ],
                                    },
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
                    goNextStep: true,
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
                                    duration: "ifelse" as any,
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
                    goNextStep: true,
                },
            ],
        }
    }
    let res = convertInkText(`
VAR duration = 3
=== start
#show image bg /image.png
# show image "bg 2 alice" /image2.png
# show image  bg '/image.png' dissolve
#show image bg /image.png  dissolve duration 3
#show image bg \`/image.png\`  dissolve duration {start: {duration} | {duration| 0 == 0} }
hello
-> DONE
`);
    expect(res).toEqual(expected1);
    await convertOperation(res);
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
                    goNextStep: true,
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
                            } as any,
                        },
                    ],
                    goNextStep: true,
                },
                {
                    dialogue: "hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
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
    await convertOperation(res);
    expect(res).toEqual(expected2);
});

test('remove image', async () => {
    let expected1: PixiVNJson = {
        labels: {
            start: [
                {
                    operation: [
                        {
                            type: "oprationtoconvert",
                            values: [
                                "remove image bg",
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
                                "remove image \"bg 2\"",
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
                                "remove image bg dissolve",
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
                                "remove image bg dissolve duration 3",
                            ],
                        },
                    ],
                    goNextStep: true,
                },
                {
                    dialogue: "Hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
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
                            operationType: "remove",
                            alias: "bg",
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "image",
                            operationType: "remove",
                            alias: "bg 2",
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "image",
                            operationType: "remove",
                            alias: "bg",
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
                            operationType: "remove",
                            alias: "bg",
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
                    dialogue: "Hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        }
    }
    let res = convertInkText(`
=== start
#remove image bg
#remove image "bg 2"
#remove image bg dissolve
#remove image bg dissolve duration 3
Hello
-> DONE
`);
    expect(res).toEqual(expected1);
    await convertOperation(res);
    expect(res).toEqual(expected2);
});

/**
 * Video
 */
test('video', async () => {
    let expected1: PixiVNJson = {
        labels: {
            start: [
                {
                    operation: [
                        {
                            type: "oprationtoconvert",
                            values: [
                                "show video bg \"/video A.mp4\"",
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
                                "pause video bg",
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
                                "resume video bg",
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
                                "remove video bg",
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
                    goNextStep: true,
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
                            type: "video",
                            operationType: "show",
                            alias: "bg",
                            url: "/video A.mp4",
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "video",
                            operationType: "pause",
                            alias: "bg",
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "video",
                            operationType: "resume",
                            alias: "bg",
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "video",
                            operationType: "remove",
                            alias: "bg",
                        },
                    ],
                    goNextStep: true,
                },
                {
                    dialogue: "hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        }
    }
    let res = convertInkText(`
=== start
# show video bg "/video A.mp4"
# pause video bg
# resume video bg
# remove video bg
hello
-> DONE
`);
    expect(res).toEqual(expected1);
    await convertOperation(res);
    expect(res).toEqual(expected2);
});

/**
 * Sound
 */
test('sound', async () => {
    let expected1: PixiVNJson = {
        labels: {
            start: [
                {
                    operation: [
                        {
                            type: "oprationtoconvert",
                            values: [
                                "add sound bird resources/bird.mp3 volume 0",
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
                                "play sound bird volume 100",
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
                                "pause sound bird",
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
                                "resume sound bird",
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
                                "remove sound bird",
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
                                "volume sound bird 100",
                            ],
                        },
                    ],
                    goNextStep: true,
                },
                {
                    dialogue: "Hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
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
                            type: "sound",
                            operationType: "add",
                            alias: "bird",
                            url: "resources/bird.mp3",
                            props: {
                                volume: 0,
                            },
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "sound",
                            operationType: "play",
                            alias: "bird",
                            props: {
                                volume: 100,
                            },
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "sound",
                            operationType: "pause",
                            alias: "bird",
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "sound",
                            operationType: "resume",
                            alias: "bird",
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "sound",
                            operationType: "remove",
                            alias: "bird",
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "sound",
                            operationType: "volume",
                            alias: "bird",
                            value: 100,
                        },
                    ],
                    goNextStep: true,
                },
                {
                    dialogue: "Hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        }
    }
    let res = convertInkText(`
=== start
#add sound bird resources/bird.mp3 volume 0
# play sound bird volume 100
# pause sound bird
# resume sound bird
# remove sound bird
# volume sound bird 100
Hello
-> DONE
`);
    expect(res).toEqual(expected1);
    await convertOperation(res);
    expect(res).toEqual(expected2);
});

/**
 * Input
 */
test('input', async () => {
    let expected1: PixiVNJson = {
        labels: {
            start: [
                {
                    operation: [
                        {
                            type: "oprationtoconvert",
                            values: [
                                "request input",
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
                                "request input number",
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
                                "request input 'array of string'",
                            ],
                        },
                    ],
                    goNextStep: true,
                },
                {
                    dialogue: "Hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
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
                            type: "input",
                            operationType: "request",
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "input",
                            operationType: "request",
                            valueType: "number",
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operation: [
                        {
                            type: "input",
                            operationType: "request",
                            valueType: "array of string",
                        },
                    ],
                    goNextStep: true,
                },
                {
                    dialogue: "Hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        }
    }
    let res = convertInkText(`
=== start
# request input
# request input number
# request input 'array of string'
Hello
-> DONE
`);
    expect(res).toEqual(expected1);
    await convertOperation(res);
    expect(res).toEqual(expected2);
});

/**
 * markdown
 */
test('markdown', async () => {
    let expected: PixiVNJson = {
        labels: {
            start: [
                {
                    dialogue: "# Markdown Test \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "Hello, this is a test of the markdown parser. Pixi'VN does not manage markdown, but you can implement a markdown parser to display text with markdown syntax. \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "For example in React, you can use the library [react-markdown](https://www.npmjs.com/package/react-markdown). \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "## Colored Text \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "<span style=\"color:blue\">some *blue* text</span>. \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "<span style=\"color:red\">some *red* text</span>. \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "<span style=\"color:green\">some *green* text</span>. \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "## Bold Text \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "**This is bold text.** \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "## Italic Text \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "*This is italic text.* \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "## Delete Text \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "~~This is deleted text.~~ \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "## Link Test \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "[Link to Google](https://www.google.com) \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "## H2 Test \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "### H3 Test \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "#### H4 Test \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "## Code Test \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "`Hello World` \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "```js \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "console.log(\"Hello World\") \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "``` \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "## List Test \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "- Item 1 \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "* Item 2 \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "- [x] Item 3 \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "## Table Test \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "| Header 1 | Header 2 | \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "| -------- | -------- | \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "| Cell 1   | Cell 2   | \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "## Separator Test \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "*** \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "Footer",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        }
    }
    let res = convertInkText(`
=== start
\\# Markdown Test \\\\n<>
Hello, this is a test of the markdown parser. Pixi'VN does not manage markdown, but you can implement a markdown parser to display text with markdown syntax. \\\\n<>

For example in React, you can use the library [react-markdown](https:\\/\\/www.npmjs.com/package/react-markdown). \\\\n<>

\\#\\# Colored Text \\\\n<>

<span style="color:blue">some *blue* text</span>. \\\\n<>

<span style="color:red">some *red* text</span>. \\\\n<>

<span style="color:green">some *green* text</span>. \\\\n<>

\\#\\# Bold Text \\\\n<>

\\**This is bold text.** \\\\n<>

\\#\\# Italic Text \\\\n<>

\\*This is italic text.* \\\\n<>

\\#\\# Delete Text \\\\n<>

\\~~This is deleted text.~~ \\\\n<>

\\#\\# Link Test \\\\n<>

[Link to Google](https:\\/\\/www.google.com) \\\\n<>

\\#\\# H2 Test \\\\n<>

\\#\\#\\# H3 Test \\\\n<>

\\#\\#\\#\\# H4 Test \\\\n<>
 
\\#\\# Code Test \\\\n<>

\\\`Hello World\\\` \\\\n<>

\\\`\\\`\\\`js \\\\n<>
console.log("Hello World") \\\\n<>
\\\`\\\`\\\` \\\\n<>

\\#\\# List Test \\\\n<>

\\- Item 1 \\\\n<>
\\* Item 2 \\\\n<>
\\- [x] Item 3 \\\\n<>

\\#\\# Table Test \\\\n<>

\\| Header 1 \\| Header 2 \\| \\\\n<>
\\| -------- \\| -------- \\| \\\\n<>
\\| Cell 1   \\| Cell 2   \\| \\\\n<>

\\#\\# Separator Test \\\\n<>

\\*\\*\\* \\\\n<>
Footer
-> DONE
`);
    expect(res).toEqual(expected);
});
