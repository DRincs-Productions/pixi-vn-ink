import { beforeEach, expect, test } from "vitest";
import { HashtagCommands, addBaseHashtagCommands } from "@/handlers/hashtag-commands";
import { convertInkToJson } from "@/loader";

function convert(command: string) {
    return HashtagCommands.convertOperation(HashtagCommands.convertTagTolist(command), {});
}

function findOperations(value: unknown, type: string): unknown[] {
    if (Array.isArray(value)) return value.flatMap((item) => findOperations(item, type));
    if (value && typeof value === "object") {
        const found = (value as { type?: unknown }).type === type ? [value] : [];
        return [...found, ...Object.values(value).flatMap((item) => findOperations(item, type))];
    }
    return [];
}

beforeEach(() => {
    HashtagCommands.clear();
    HashtagCommands.clearMappers();
    addBaseHashtagCommands();
});

test("show maps source, display options and transitions to the JSON operation", () => {
    expect(
        convert(
            "show asprite hero heroSheet animation walk useFrameDurations true loop false with dissolve duration 2",
        ),
    ).toEqual({
        type: "asprite",
        operationType: "show",
        alias: "hero",
        source: { spritesheet: "heroSheet", animation: "walk", useFrameDurations: true },
        props: { loop: false },
        transition: { type: "dissolve", props: { duration: 2 } },
    });
});

test("pause, resume, goto, edit and remove map to JSON operations", () => {
    const commands = [
        "pause asprite hero",
        "resume asprite hero",
        "goto asprite hero 3",
        "edit asprite hero animationSpeed 0.5 animation run",
        "remove asprite hero",
        "remove asprite hero with moveout duration 1",
    ];
    expect(commands.map(convert)).toEqual([
        { type: "asprite", operationType: "pause", alias: "hero" },
        { type: "asprite", operationType: "resume", alias: "hero" },
        { type: "asprite", operationType: "goto", alias: "hero", frame: 3 },
        {
            type: "asprite",
            operationType: "edit",
            alias: "hero",
            props: { animationSpeed: 0.5, source: { animation: "run" } },
        },
        { type: "asprite", operationType: "remove", alias: "hero" },
        {
            type: "asprite",
            operationType: "remove",
            alias: "hero",
            transition: { type: "moveout", props: { duration: 1 } },
        },
    ]);
});

test("show supports alias defaults and explicit frame lists", () => {
    expect(convert("show asprite hero animation walk")).toEqual({
        type: "asprite",
        operationType: "show",
        alias: "hero",
        source: { animation: "walk" },
        props: {},
    });
    expect(convert("show asprite hero heroSheet frames [ open.png closed.png ]")).toEqual({
        type: "asprite",
        operationType: "show",
        alias: "hero",
        source: { spritesheet: "heroSheet", frames: ["open.png", "closed.png"] },
        props: {},
    });
});

test("show and edit preserve positional sources, frame objects and transition props", () => {
    expect(
        convert(
            'show asprite hero heroSheet frames [ walk.png { "texture": "idle.png", "duration": 80 } ] with fade duration 0.5',
        ),
    ).toEqual({
        type: "asprite",
        operationType: "show",
        alias: "hero",
        source: {
            spritesheet: "heroSheet",
            frames: ["walk.png", { texture: "idle.png", duration: 80 }],
        },
        props: {},
        transition: { type: "fade", props: { duration: 0.5 } },
    });

    expect(convert("edit asprite hero frames [ one.png two.png ] animation run")).toEqual({
        type: "asprite",
        operationType: "edit",
        alias: "hero",
        props: { source: { frames: ["one.png", "two.png"], animation: "run" } },
    });
});

test("invalid transitions and frame indexes are rejected", () => {
    expect(() => convert("show asprite hero with notatransition")).toThrow(
        /entrance transition/,
    );
    expect(() => convert("remove asprite hero with notatransition")).toThrow(
        /removal transition/,
    );
    expect(() => convert("edit asprite hero loop false with fade")).toThrow(
        /does not support transitions/,
    );
    expect(() => convert("goto asprite hero first")).toThrow(/frame index/);
    expect(() => convert("goto asprite hero")).toThrow(/frame index/);
});

test("pause, resume and goto reject extra arguments", () => {
    expect(() => convert("pause asprite hero now")).toThrow(/pause arguments: now/);
    expect(() => convert("resume asprite hero now")).toThrow(/resume arguments: now/);
    expect(() => convert("goto asprite hero 2 3")).toThrow(/goto arguments: 3/);
});

test("compilation emits static asprite JSON operations", () => {
    const result = convertInkToJson(
        "=== start ===\n# show asprite hero animation walk\n# goto asprite hero 2\nHello!\n",
    );
    const json = JSON.stringify(result);
    expect(json).not.toContain("operationtoconvert");
    expect(findOperations(result, "asprite")).toEqual([
        expect.objectContaining({
            type: "asprite",
            operationType: "show",
            alias: "hero",
            source: { animation: "walk" },
            props: {},
        }),
        expect.objectContaining({
            type: "asprite",
            operationType: "goto",
            alias: "hero",
            frame: 2,
        }),
    ]);
});

test("compilation defers malformed animated sprite commands", () => {
    for (const command of [
        "# show asprite hero with",
        "# show asprite hero frames [ one.png",
        "# remove asprite hero with",
    ]) {
        const result = convertInkToJson(`=== start ===\n${command}\nHello!\n`);
        expect(JSON.stringify(result), command).toContain("operationtoconvert");
    }
});
