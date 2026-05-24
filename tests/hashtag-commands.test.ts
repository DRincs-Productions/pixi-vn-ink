import { HashtagCommands } from "@/handlers/hashtag-commands";
import type { PixiVNJsonLabelStep } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";
import { z } from "zod";

test("mergeJsonBlocks merges sibling JSON-like blocks", () => {
    expect(
        HashtagCommands.mergeJsonBlocks([
            "position",
            "{",
            "x:",
            "1",
            "}",
            "anchor",
            "{",
            "y:",
            "2",
            "}",
        ]),
    ).toEqual(["position", "{ x: 1 }", "anchor", "{ y: 2 }"]);
});

test("mergeJsonBlocks merges nested valid blocks", () => {
    expect(
        HashtagCommands.mergeJsonBlocks(["{", "x:", "1,", "nested:", "{", "y:", "2", "}", "}"]),
    ).toEqual(["{ x: 1, nested: { y: 2 } }"]);
});

test("mergeJsonBlocks keeps an invalid parent split while preserving valid children", () => {
    expect(
        HashtagCommands.mergeJsonBlocks(["{", "x:", "1", "nested:", "{", "y:", "2", "}", "}"]),
    ).toEqual(["{", "x:", "1", "nested:", "{ y: 2 }", "}"]);
});

test("convertTagTolist uses mergeJsonBlocks for repeated JSON-like props", () => {
    expect(
        HashtagCommands.convertTagTolist(
            "edit image bg position { x: 1 } anchor { y: 2 } visible true",
        ),
    ).toEqual([
        "edit",
        "image",
        "bg",
        "position",
        "{ x: 1 }",
        "anchor",
        "{ y: 2 }",
        "visible",
        "true",
    ]);
});

test("convertOperation maps shake with even key/value params", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(HashtagCommands.convertOperation(["shake", "bg", "x", "10", "y", "20"], step)).toEqual({
        alias: "bg",
        type: "shake",
        props: { x: 10, y: 20 },
    });
});

test("convertOperation maps shake with no params", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(HashtagCommands.convertOperation(["shake", "bg"], step)).toEqual({
        alias: "bg",
        type: "shake",
        props: {},
    });
});

test("convertOperation maps shake with quoted-string alias", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(HashtagCommands.convertOperation(["shake", "my bg"], step)).toEqual({
        alias: "my bg",
        type: "shake",
        props: {},
    });
});

test("convertOperation maps shake with string and boolean values", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(
        HashtagCommands.convertOperation(
            ["shake", "bg", "intensity", "high", "enabled", "true"],
            step,
        ),
    ).toEqual({
        alias: "bg",
        type: "shake",
        props: { intensity: "high", enabled: true },
    });
});

test("convertOperation rejects shake with odd params", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(HashtagCommands.convertOperation(["shake", "bg", "x"], step)).toBeUndefined();
});

test("convertOperation maps animate with keyframes and options key/value params", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(
        HashtagCommands.convertOperation(
            ["animate", "bg", "x", "100", "y", "200", "options", "duration", "3"],
            step,
        ),
    ).toEqual({
        alias: "bg",
        type: "animate",
        keyframes: { x: 100, y: 200 },
        options: { duration: 3 },
    });
});

test("convertOperation maps animate with no params", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(HashtagCommands.convertOperation(["animate", "bg"], step)).toEqual({
        alias: "bg",
        type: "animate",
        keyframes: {},
        options: {},
    });
});

test("convertOperation maps animate with only keyframes, no options section", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(HashtagCommands.convertOperation(["animate", "bg", "angle", "90"], step)).toEqual({
        alias: "bg",
        type: "animate",
        keyframes: { angle: 90 },
        options: {},
    });
});

test("convertOperation maps animate with empty keyframes and options keyword", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(
        HashtagCommands.convertOperation(["animate", "bg", "options", "duration", "3"], step),
    ).toEqual({
        alias: "bg",
        type: "animate",
        keyframes: {},
        options: { duration: 3 },
    });
});

test("convertOperation rejects animate with duplicate options keyword", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(
        HashtagCommands.convertOperation(
            [
                "animate",
                "bg",
                "x",
                "100",
                "options",
                "duration",
                "3",
                "options",
                "easing",
                "linear",
            ],
            step,
        ),
    ).toBeUndefined();
});

test("convertOperation rejects animate with odd keyframes or options params", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    expect(HashtagCommands.convertOperation(["animate", "bg", "x"], step)).toBeUndefined();
    expect(
        HashtagCommands.convertOperation(
            ["animate", "bg", "x", "100", "options", "duration"],
            step,
        ),
    ).toBeUndefined();
});

test("run custom handler uses regex validation filter", async () => {
    HashtagCommands.clear();
    const calls: string[] = [];
    HashtagCommands.add(
        (script) => {
            calls.push(script.join(" "));
            return true;
        },
        {
            name: "only-jump",
            validation: /^jump\b/,
        },
    );

    const step = {} as unknown as PixiVNJsonLabelStep;
    await HashtagCommands.run("pause", step, {});
    await HashtagCommands.run("jump target", step, {});

    expect(calls).toEqual(["jump target"]);
    HashtagCommands.clear();
});

test("run custom handler uses zod validation filter", async () => {
    HashtagCommands.clear();
    let called = 0;
    HashtagCommands.add(
        () => {
            called += 1;
            return true;
        },
        {
            name: "jump-zod",
            validation: z.tuple([z.literal("jump"), z.string()]),
        },
    );

    const step = {} as unknown as PixiVNJsonLabelStep;
    await HashtagCommands.run("jump dest", step, {});
    await HashtagCommands.run("jump", step, {});

    expect(called).toBe(1);
    HashtagCommands.clear();
});

test("run custom handler supports deprecated add(handler) overload", async () => {
    HashtagCommands.clear();
    let called = 0;
    HashtagCommands.add(() => {
        called += 1;
        return false;
    });

    const step = {} as unknown as PixiVNJsonLabelStep;
    await HashtagCommands.run("shake bg", step, {});

    expect(called).toBe(1);
    HashtagCommands.clear();
});

test("add: last registered handler runs first", async () => {
    HashtagCommands.clear();
    const order: string[] = [];
    HashtagCommands.add(
        () => {
            order.push("first");
            return false;
        },
        { name: "first", validation: /^ping\b/ },
    );
    HashtagCommands.add(
        () => {
            order.push("second");
            return true;
        },
        { name: "second", validation: /^ping\b/ },
    );

    const step = {} as unknown as PixiVNJsonLabelStep;
    await HashtagCommands.run("ping", step, {});

    expect(order).toEqual(["second"]);
    HashtagCommands.clear();
});

test("addMapper: last registered mapper runs first", () => {
    HashtagCommands.clearMappers();
    const step = {} as unknown as PixiVNJsonLabelStep;

    HashtagCommands.addMapper(
        () => ({ type: "image", operationType: "edit", alias: "first" }),
        { name: "mapper-first", validation: z.tuple([z.literal("testmapper"), z.string()]) },
    );
    HashtagCommands.addMapper(
        () => ({ type: "image", operationType: "edit", alias: "second" }),
        { name: "mapper-second", validation: z.tuple([z.literal("testmapper"), z.string()]) },
    );

    const result = HashtagCommands.convertOperation(["testmapper", "bg"], step);

    expect((result as { alias: string }).alias).toBe("second");
    HashtagCommands.clearMappers();
});
