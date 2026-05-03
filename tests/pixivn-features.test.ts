import { onReplaceTextAfterTranslation } from "@/functions";
import { convertInkText } from "@/loader";
import { CharacterBaseModel, RegisteredCharacters } from "@drincs/pixi-vn";
import { type PixiVNJson, PIXIVNJSON_SCHEMA_URL, translator } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";
import { convertOperation } from "./convertOperation";

test("Assign dialogue to a character", async () => {
    const alice = new CharacterBaseModel("alice", {
        name: "Alice",
    });
    RegisteredCharacters.add(alice);
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
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
        },
    };
    const res = convertInkText(`
=== start
alice: Hello, world!
-> DONE
`);
    expect(res).toEqual(expected);
});

test("Assign dialogue to a character: double colons in a sentence", async () => {
    const james = new CharacterBaseModel("james", {
        name: "James",
    });
    RegisteredCharacters.add(james);
    const expected1: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    dialogue: {
                        character: "james",
                        text: "Well, I mean, you are kinda acting like a father. Like, I can totally see it: I'm the daughter, and you as my father, you want to make sure I'm going out with the right guy... or something...",
                    },
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const res = convertInkText(`
=== start ===
james: Well, I mean, you are kinda acting like a father. Like, I can totally see it: I'm the daughter, and you as my father, you want to make sure I'm going out with the right guy... or something...
-> DONE
`);
    expect(res).toEqual(expected1);
});

/**
 * Image
 */

test("show image", async () => {
    const expected1: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
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
                    goNextStep: true,
                    operations: [
                        {
                            type: "image",
                            operationType: "show",
                            alias: "alias",
                            url: "alias",
                            $origin: "show image alias",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "image",
                            operationType: "show",
                            alias: "bg",
                            url: "/image.png",
                            $origin: "show image bg /image.png",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "image",
                            operationType: "show",
                            alias: "bg 2 alice",
                            url: "/image2.png",
                            $origin: 'show image "bg 2 alice" /image2.png',
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "image",
                            operationType: "show",
                            alias: "bg",
                            url: "/image.png",
                            transition: {
                                type: "dissolve",
                            },
                            $origin: "show image  bg '/image.png' with dissolve",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
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
                            $origin: "show image bg /image.png  with dissolve duration 3",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "operationtoconvert",
                            values: [
                                "show image bg `/image.png` x 10  with dissolve duration ",
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
                                                storageOperationType: "get",
                                                storageType: "storage",
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
                                                elements: ["duration", " 0 == 0"],
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
                },
                {
                    dialogue: "hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const expected2: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
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
                    goNextStep: true,
                    operations: [
                        {
                            type: "image",
                            operationType: "show",
                            alias: "alias",
                            url: "alias",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "image",
                            operationType: "show",
                            alias: "bg",
                            url: "/image.png",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "image",
                            operationType: "show",
                            alias: "bg 2 alice",
                            url: "/image2.png",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
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
                    goNextStep: true,
                    operations: [
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
                    goNextStep: true,
                    operations: [
                        {
                            type: "image",
                            operationType: "show",
                            alias: "bg",
                            url: "/image.png",
                            transition: {
                                type: "dissolve",
                                props: {
                                    duration: "ifelse",
                                },
                            },
                            props: {
                                x: 10,
                            },
                        },
                    ],
                },
                {
                    dialogue: "hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const res = convertInkText(`
VAR duration = 3
=== start
#show image alias
#show image bg /image.png
# show image "bg 2 alice" /image2.png
# show image  bg '/image.png' with dissolve
#show image bg /image.png  with dissolve duration 3
#show image bg \`/image.png\` x 10  with dissolve duration {start: {duration} | {duration| 0 == 0} }
hello
-> DONE
`);
    expect(res).toEqual(expected1);
    await convertOperation(res);
    expect(res).toEqual(expected2);
});

test("edit image", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "image",
                            operationType: "edit",
                            alias: "bg",
                            props: {
                                position: {
                                    x: -20.5,
                                    y: 30,
                                    test: "test } ' test",
                                    test2: "'",
                                },
                                visible: true,
                                cursor: "pointer",
                                alpha: 0.5,
                            },
                            $origin:
                                'edit image bg position { "x": -20.5, "y": 30, "test": "test \\} \' test", "test2": "\'" } visible true   cursor "pointer" alpha 0.5',
                        },
                    ],
                },
                {
                    dialogue: "hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const res = convertInkText(`
=== start
#edit image bg position \\{ "x": -20.5, "y": 30, "test": "test \\\\\\} ' test", "test2": "'" \\} visible true   cursor "pointer" alpha 0.5 
hello
-> DONE
`);
    expect(res).toEqual(expected);
});

test("remove image", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "image",
                            operationType: "remove",
                            alias: "bg",
                            $origin: "remove image bg",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "image",
                            operationType: "remove",
                            alias: "bg 2",
                            $origin: 'remove image "bg 2"',
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "image",
                            operationType: "remove",
                            alias: "bg",
                            transition: {
                                type: "dissolve",
                            },
                            $origin: "remove image bg with dissolve",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
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
                            $origin: "remove image bg with dissolve duration 3",
                        },
                    ],
                },
                {
                    dialogue: "Hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const res = convertInkText(`
=== start
#remove image bg
#remove image "bg 2"
#remove image bg with dissolve
#remove image bg with dissolve duration 3
Hello
-> DONE
`);
    expect(res).toEqual(expected);
});

test("effect image", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    goNextStep: true,
                    operations: [
                        {
                            alias: "bg",
                            type: "shake",
                            props: {},
                            $origin: "shake bg",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            alias: "bg",
                            type: "animate",
                            keyframes: {
                                angle: 90,
                            },
                            options: {},
                            $origin: "animate bg angle 90",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            alias: "bg",
                            type: "animate",
                            keyframes: {
                                x: 100,
                                y: 200,
                            },
                            options: {
                                duration: 3,
                            },
                            $origin: "animate bg x 100 y 200 options duration 3",
                        },
                    ],
                },
                {
                    operations: [
                        {
                            type: "dialogue",
                            operationType: "clean",
                            $origin: "pause",
                        },
                    ],
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const res = convertInkText(`
=== start
# shake bg
# animate bg angle 90
# animate bg x 100 y 200 options duration 3
# pause
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * Video
 */
test("video", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "video",
                            operationType: "show",
                            alias: "bg",
                            url: "/video A.mp4",
                            $origin: 'show video bg "/video A.mp4"',
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "video",
                            operationType: "pause",
                            alias: "bg",
                            $origin: "pause video bg",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "video",
                            operationType: "resume",
                            alias: "bg",
                            $origin: "resume video bg",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "video",
                            operationType: "remove",
                            alias: "bg",
                            $origin: "remove video bg",
                        },
                    ],
                },
                {
                    dialogue: "hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const res = convertInkText(`
=== start
# show video bg "/video A.mp4"
# pause video bg
# resume video bg
# remove video bg
hello
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * ImageContainer
 */
test("imagecontainer", async () => {
    const expected1: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "operationtoconvert",
                            values: [
                                'show imagecontainer bg ["/image A.png" image  ] x 10 y 20 with dissolve',
                            ],
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "imagecontainer",
                            operationType: "remove",
                            alias: "bg",
                            $origin: "remove imagecontainer bg",
                        },
                    ],
                },
                {
                    dialogue: "hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const expected2: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    operations: [
                        {
                            type: "imagecontainer",
                            operationType: "show",
                            alias: "bg",
                            urls: ["/image A.png", "image"],
                            transition: {
                                type: "dissolve",
                            },
                            props: {
                                x: 10,
                                y: 20,
                            },
                        },
                    ],
                    goNextStep: true,
                },
                {
                    operations: [
                        {
                            type: "imagecontainer",
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
        },
    };
    const res = convertInkText(`
=== start
# show imagecontainer bg ["/image A.png" image  ] x 10 y 20 with dissolve
# remove imagecontainer bg
hello
-> DONE
`);
    expect(res).toEqual(expected1);
    await convertOperation(res);
    expect(res).toEqual(expected2);
});

/**
 * ImageContainer
 */
test("text", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "text",
                            operationType: "show",
                            alias: "myText",
                            text: "Hello world",
                            transition: {
                                type: "dissolve",
                            },
                            props: {
                                x: 10,
                                y: 20,
                                style: {
                                    fontFamily: "Arial",
                                    dropShadow: {
                                        alpha: 0.8,
                                        angle: 2.1,
                                        blur: 4,
                                        color: "0x111111",
                                        distance: 10,
                                    },
                                    fill: "#ffffff",
                                    stroke: {
                                        color: "#004620",
                                        width: 12,
                                        join: "round",
                                    },
                                    fontSize: 60,
                                    fontWeight: "lighter",
                                },
                            },
                            $origin:
                                'show text myText "Hello world" x 10 y 20 style { fontFamily: "Arial", dropShadow: { alpha: 0.8, angle: 2.1, blur: 4, color: "0x111111", distance: 10, }, fill: "#ffffff", stroke: { color: "#004620", width: 12, join: "round" }, fontSize: 60, fontWeight: "lighter" } with dissolve',
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "text",
                            operationType: "remove",
                            alias: "myText",
                            $origin: "remove text myText",
                        },
                    ],
                },
                {
                    operations: [
                        {
                            type: "dialogue",
                            operationType: "clean",
                            $origin: "pause",
                        },
                    ],
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const res = convertInkText(`
=== start
# show text myText "Hello world" x 10 y 20 style \\{ fontFamily: "Arial", dropShadow: \\{ alpha: 0.8, angle: 2.1, blur: 4, color: "0x111111", distance: 10, \\}, fill: "\\#ffffff", stroke: \\{ color: "\\#004620", width: 12, join: "round" \\}, fontSize: 60, fontWeight: "lighter" \\} with dissolve
# remove text myText
# pause
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * Sound
 */
test("sound", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "sound",
                            operationType: "play",
                            alias: "bird",
                            url: "bird",
                            props: {
                                volume: 100,
                            },
                            $origin: "play sound bird volume 100",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "sound",
                            operationType: "play",
                            alias: "bird",
                            url: "bird 2",
                            props: {
                                volume: 100,
                            },
                            $origin: 'play sound bird "bird 2" volume 100',
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "sound",
                            operationType: "pause",
                            alias: "bird",
                            $origin: "pause sound bird",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "sound",
                            operationType: "resume",
                            alias: "bird",
                            $origin: "resume sound bird",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "sound",
                            operationType: "stop",
                            alias: "bird",
                            $origin: "remove sound bird",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "sound",
                            operationType: "edit",
                            alias: "bird",
                            props: {
                                volume: 100,
                            },
                            $origin: "edit sound bird volume 100",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "sound",
                            operationType: "edit",
                            alias: "bird",
                            props: {
                                muted: true,
                            },
                            $origin: "edit sound bird muted true",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "all",
                            operationType: "pause",
                            $origin: "pause all sounds",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "all",
                            operationType: "resume",
                            $origin: "resume all sounds",
                        },
                    ],
                },
                {
                    dialogue: "Hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const res = convertInkText(`
=== start
# play sound bird volume 100
# play sound bird "bird 2" volume 100
# pause sound bird
# resume sound bird
# remove sound bird
# edit sound bird volume 100
# edit sound bird muted true
# pause all sounds
# resume all sounds
Hello
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * Assets
 */
test("assets", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "assets",
                            operationType: "load",
                            aliases: ["url1", "url2"],
                            $origin: "load assets url1 url2",
                        },
                    ],
                },
                {
                    dialogue: "hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const res = convertInkText(`
=== start
# load assets url1 url2
hello
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * Input
 */
test("input", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "input",
                            operationType: "request",
                            $origin: "request input",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "input",
                            operationType: "request",
                            valueType: "number",
                            defaultValue: 0,
                            $origin: "request input type number default 0",
                        },
                    ],
                },
                {
                    operations: [
                        {
                            type: "dialogue",
                            operationType: "clean",
                            $origin: "pause",
                        },
                    ],
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "input",
                            operationType: "request",
                            valueType: "array of string",
                            $origin: "request input  type 'array of string'",
                        },
                    ],
                },
                {
                    dialogue: "Hello",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const res = convertInkText(`
=== start
# request input
# request input type number default 0
# pause
# request input  type 'array of string'
Hello
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * Replace
 */
test("replace", async () => {
    onReplaceTextAfterTranslation((key) => {
        if (key === "john") {
            return "John";
        }
        if (key === "alice") {
            return "Alice";
        }
    });
    const res = translator.translate(`Hello [john], my name is [alice]`);
    expect(res).toEqual(`Hello John, my name is Alice`);
});

/**
 * markdown
 */
test("markdown", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    dialogue: "# Markdown Test \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue:
                        "Hello, this is a test of the markdown parser. Pixi'VN does not manage markdown, but you can implement a markdown parser to display text with markdown syntax. \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue:
                        "For example in React, you can use the library [react-markdown](https://www.npmjs.com/package/react-markdown). \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: "## Colored Text \n",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: '<span style="color:blue">some *blue* text</span>. \n',
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: '<span style="color:red">some *red* text</span>. \n',
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    dialogue: '<span style="color:green">some *green* text</span>. \n',
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
                    dialogue: 'console.log("Hello World") \n',
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
        },
    };
    const res = convertInkText(`
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

/**
 * markdown
 */
test("jump", async () => {
    const expected1: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    dialogue: "Start",
                },
                {
                    goNextStep: undefined,
                    labelToOpen: {
                        label: "after",
                        type: "jump",
                    },
                    operations: [
                        {
                            type: "operationtoconvert",
                            values: ["jump after"],
                        },
                    ],
                },
                {
                    dialogue: "Start End",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            after: [
                {
                    dialogue: "After",
                },
                {
                    dialogue: "After End",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const expected2: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    dialogue: "Start",
                },
                {
                    operations: [],
                    goNextStep: undefined,
                    labelToOpen: {
                        label: "after",
                        type: "jump",
                    },
                },
                {
                    dialogue: "Start End",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            after: [
                {
                    dialogue: "After",
                },
                {
                    dialogue: "After End",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const res = convertInkText(`
=== start ===
Start
# jump after // [!code focus]
Start End
-> DONE

=== after ===
After
After End
-> DONE
`);
    expect(res).toEqual(expected1);
    await convertOperation(res);
    expect(res).toEqual(expected2);
});

test("continue", async () => {
    const expected2: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            "hurry_home_|_c-1": [
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
            hurry_home: [
                {
                    dialogue: "We hurried home ",
                    glueEnabled: true,
                    goNextStep: true,
                },
                {
                    operations: [],
                    goNextStep: true,
                    glueEnabled: false,
                },
                {
                    choices: [
                        {
                            text: "1",
                            label: "hurry_home_|_c-0",
                            props: {},
                            type: "call",
                        },
                        {
                            text: "2",
                            label: "hurry_home_|_c-1",
                            props: {},
                            type: "call",
                        },
                    ],
                },
            ],
        },
    };
    const res = convertInkText(`
=== hurry_home ===
We hurried home <># continue
+ [1]
+ [2]
-> DONE
`);
    await convertOperation(res);
    expect(res).toEqual(expected2);
});
