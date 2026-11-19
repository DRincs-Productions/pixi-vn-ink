import { convertInkToJson, convertJsonToInk } from "@/converter";
import { addBaseHashtagCommands, HashtagCommands } from "@/handlers";
import { PIXIVNJSON_SCHEMA_URL, type PixiVNJson, type PixiVNJsonOperation } from "@drincs/pixi-vn-json";
import { afterAll, beforeAll, expect, test } from "vitest";
import z from "zod";

beforeAll(() => {
    HashtagCommands.clearMappers();
    addBaseHashtagCommands();
});
afterAll(() => HashtagCommands.clearMappers());

function stripOrigin<T>(value: T): T {
    if (Array.isArray(value)) return value.map(stripOrigin) as T;
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([key]) => key !== "$origin")
                .map(([key, item]) => [key, stripOrigin(item)]),
        ) as T;
    }
    return value;
}

function jsonWith(operation: PixiVNJsonOperation, goNextStep = true): PixiVNJson {
    return {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                goNextStep ? { operations: [operation], goNextStep } : { operations: [operation] },
                { dialogue: "Hi" },
            ],
        },
    };
}

/** JSON → Ink → JSON with inference on; the compiler adds `$origin`, which the input never had. */
function roundTrip(operation: PixiVNJsonOperation, goNextStep = true): void {
    const json = jsonWith(operation, goNextStep);
    const ink = convertJsonToInk(json, { inferHashtagCommands: true });
    expect(stripOrigin(convertInkToJson(ink))).toEqual(json);
}

const operations: Record<string, PixiVNJsonOperation> = {
    "show image with transition and props": {
        type: "image",
        operationType: "show",
        alias: "bg",
        url: "bg",
        props: { xAlign: 0.5, yAlign: 1 },
        transition: { type: "dissolve", props: { duration: 3 } },
    },
    "show image with a different source": {
        type: "image",
        operationType: "show",
        alias: "bg",
        url: "images/bg.png",
    },
    "show text with a nested style": {
        type: "text",
        operationType: "show",
        alias: "myText",
        text: "Hello world",
        props: {
            x: 10,
            y: 20,
            style: { fontFamily: "Arial", fill: "#ffffff", stroke: { color: "#004620", width: 12 } },
        },
    },
    "show image container": {
        type: "imagecontainer",
        operationType: "show",
        alias: "sly",
        urls: ["a", "b"],
        props: { xAlign: 0.2 },
        transition: { type: "movein", props: { direction: "right" } },
    },
    "show video": { type: "video", operationType: "show", alias: "clip", url: "clip" },
    "edit image": { type: "image", operationType: "edit", alias: "bg", props: { alpha: 0.5 } },
    "remove image with transition": {
        type: "image",
        operationType: "remove",
        alias: "bg",
        transition: { type: "fade", props: { duration: 2 } },
    },
    "clear canvas": { type: "canvas", operationType: "clear" },
    "play sound": { type: "sound", operationType: "play", alias: "music", url: "music" },
    "play sound with source and props": {
        type: "sound",
        operationType: "play",
        alias: "music",
        url: "audio/music.mp3",
        props: { volume: 0.5 },
    },
    "stop sound": { type: "sound", operationType: "stop", alias: "music" },
    "pause channel": { type: "channel", operationType: "pause", alias: "bgm" },
    "pause all sounds": { type: "all", operationType: "pause" },
    "load assets": { type: "assets", operationType: "load", aliases: ["a", "b"] },
    "lazyload bundle": { type: "bundle", operationType: "lazyload", aliases: ["intro"] },
    "pause (clean dialogue)": { type: "dialogue", operationType: "clean" },
    "request input": { type: "input", operationType: "request", valueType: "number", defaultValue: 18 },
    "shake effect": { type: "shake", alias: "bg", props: { duration: 3 } } as PixiVNJsonOperation,
    "pause video": { type: "video", operationType: "pause", alias: "clip" },
};

for (const [name, operation] of Object.entries(operations)) {
    test(`infers the Hashtag-Command for: ${name}`, () => {
        // `# pause` removes `goNextStep` from its step.
        roundTrip(operation, operation.type !== "dialogue");
    });
}

test("writes a props object as Ink props", () => {
    expect(HashtagCommands.convertObjToInkProps({ duration: 3 })).toBe("duration 3");
    expect(HashtagCommands.convertObjToInkProps({ xAlign: 0.5, yAlign: 1 })).toBe(
        "xAlign 0.5 yAlign 1",
    );
    expect(
        HashtagCommands.convertObjToInkProps({
            x: 10,
            style: { fontFamily: "Arial", stroke: { color: "#004620", width: 12 } },
        }),
    ).toBe('x 10 style { fontFamily: "Arial", stroke: { color: "#004620", width: 12 } }');
});

test("props written by convertObjToInkProps are read back unchanged", () => {
    const props = { name: "hello world", count: "123", flag: true, zero: 0, hex: "0x11" };
    const tokens = HashtagCommands.convertTagTolist(HashtagCommands.convertObjToInkProps(props));
    expect(HashtagCommands.convertListStringToObj(tokens)).toEqual(props);
});

test("an operation with $origin always uses it", () => {
    const json = jsonWith({
        type: "image",
        operationType: "show",
        alias: "bg",
        url: "bg",
        props: { xAlign: 0.1 },
        $origin: "show image bg bg xAlign 0.1",
    } as PixiVNJsonOperation);
    const ink = convertJsonToInk(json, { inferHashtagCommands: true });
    expect(ink).toContain("# show image bg bg xAlign 0.1");
    expect(convertInkToJson(ink)).toEqual(json);
});

test("without the flag an operation without $origin still throws", () => {
    expect(() =>
        convertJsonToInk(jsonWith({ type: "canvas", operationType: "clear" })),
    ).toThrow("labels.start[0].operations[0]");
});

test("a custom mapper with a reverse function is inferred", () => {
    HashtagCommands.addMapper(
        (list) => ({
            type: "camera",
            operationType: "zoom",
            level: Number(list[1]),
        }) as unknown as PixiVNJsonOperation,
        {
            name: "zoom-command",
            validation: z.tuple([z.literal("zoom"), z.string()]),
            reverse: (op) =>
                (op as { type: string }).type === "camera"
                    ? `zoom ${(op as unknown as { level: number }).level}`
                    : undefined,
        },
    );
    roundTrip({ type: "camera", operationType: "zoom", level: 2 } as unknown as PixiVNJsonOperation);
});

test("a custom mapper that follows the convention is inferred without reverse", () => {
    HashtagCommands.addMapper(
        (list) =>
            ({
                type: "light",
                operationType: "edit",
                alias: list[2],
                props: HashtagCommands.convertListStringToObj(list.slice(3)),
            }) as unknown as PixiVNJsonOperation,
        {
            name: "edit-light",
            validation: z.tuple([z.literal("edit"), z.literal("light"), z.string()]).rest(z.string()),
        },
    );
    roundTrip({
        type: "light",
        operationType: "edit",
        alias: "lamp",
        props: { power: 3 },
    } as unknown as PixiVNJsonOperation);
});

test("throws a path-specific error when no Hashtag-Command reproduces the operation", () => {
    expect(() =>
        convertJsonToInk(
            jsonWith({ type: "unknown-thing", operationType: "do", alias: "x" } as unknown as PixiVNJsonOperation),
            { inferHashtagCommands: true },
        ),
    ).toThrow("labels.start[0].operations[0]");
});
