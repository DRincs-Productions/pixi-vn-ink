import { addBaseHashtagCommands, HashtagCommands } from "@/handlers/hashtag-commands";
import { convertInkToJson } from "@/loader";
import { InkCompiler } from "@/parser";
import type { InkHashtagCommandInfo } from "@/parser/types";
import type { PixiVNJsonLabelStep } from "@drincs/pixi-vn-json";
import { afterEach, expect, test, vi } from "vitest";
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

afterEach(() => {
    vi.restoreAllMocks();
});

test("convertOperation logs 'not valid' on a mapper miss by default", () => {
    const step = {} as unknown as PixiVNJsonLabelStep;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(HashtagCommands.convertOperation(["totally-unknown-command"], step)).toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("The operation is not valid"),
        ["totally-unknown-command"],
    );
});

test("convertOperation with { silent: true } suppresses the 'not valid' log on a mapper miss", () => {
    // Regression test: `adding-elements.ts` speculatively calls `convertOperation` to see if a
    // hashtag script resolves via the built-in mapper table, before falling back to a deferred
    // `operationtoconvert` step resolved later through the full `run()` pipeline (which also
    // checks custom `.add()`-registered handlers). Without `silent: true`, every command
    // registered only via `.add()` — e.g. app-specific commands, or `createNqtrHandler`'s
    // room/quest/activity commands — would log a false "not valid" error on every single parse,
    // even though it resolves correctly once `run()` reaches it.
    const step = {} as unknown as PixiVNJsonLabelStep;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = HashtagCommands.convertOperation(["enter", "room", "mc_room"], step, {
        silent: true,
    });

    expect(result).toBeUndefined();
    expect(errorSpy).not.toHaveBeenCalled();
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

// ── addBaseHashtagCommands(options) — bundleIds/assetAliasIds validation ───

test("addBaseHashtagCommands restricts 'load assets'/'load bundle' aliases to the known ids when provided", () => {
    HashtagCommands.clearMappers();
    addBaseHashtagCommands({ bundleIds: ["intro"], assetAliasIds: ["alice"] });
    const step = {} as unknown as PixiVNJsonLabelStep;

    expect(HashtagCommands.convertOperation(["load", "assets", "alice"], step)).toEqual({
        type: "assets",
        operationType: "load",
        aliases: ["alice"],
    });
    expect(HashtagCommands.convertOperation(["lazyload", "bundle", "intro"], step)).toEqual({
        type: "bundle",
        operationType: "lazyload",
        aliases: ["intro"],
    });

    // An id outside the known list matches neither union branch, so the mapper misses entirely.
    expect(
        HashtagCommands.convertOperation(["load", "assets", "unknown"], step, { silent: true }),
    ).toBeUndefined();
    expect(
        HashtagCommands.convertOperation(["load", "bundle", "unknown"], step, { silent: true }),
    ).toBeUndefined();

    HashtagCommands.clearMappers();
});

test("addBaseHashtagCommands accepts any alias when bundleIds/assetAliasIds are not provided", () => {
    HashtagCommands.clearMappers();
    addBaseHashtagCommands();
    const step = {} as unknown as PixiVNJsonLabelStep;

    expect(HashtagCommands.convertOperation(["load", "assets", "anything"], step)).toEqual({
        type: "assets",
        operationType: "load",
        aliases: ["anything"],
    });
    expect(HashtagCommands.convertOperation(["load", "bundle", "anything"], step)).toEqual({
        type: "bundle",
        operationType: "load",
        aliases: ["anything"],
    });

    HashtagCommands.clearMappers();
});

test("addBaseHashtagCommands restricts 'show imagecontainer' urls to the known assetAliasIds when provided", () => {
    HashtagCommands.clearMappers();
    addBaseHashtagCommands({ assetAliasIds: ["img1", "img2"] });
    const step = {} as unknown as PixiVNJsonLabelStep;

    expect(
        HashtagCommands.convertOperation(
            ["show", "imagecontainer", "bg", "[", "img1", "img2", "]"],
            step,
        ),
    ).toEqual({
        type: "imagecontainer",
        operationType: "show",
        alias: "bg",
        urls: ["img1", "img2"],
    });

    // A url outside the known list matches no mapper, so it misses entirely.
    expect(
        HashtagCommands.convertOperation(
            ["show", "imagecontainer", "bg", "[", "img1", "unknown", "]"],
            step,
            { silent: true },
        ),
    ).toBeUndefined();

    HashtagCommands.clearMappers();
});

test("addBaseHashtagCommands accepts any 'show imagecontainer' url when assetAliasIds is not provided", () => {
    HashtagCommands.clearMappers();
    addBaseHashtagCommands();
    const step = {} as unknown as PixiVNJsonLabelStep;

    expect(
        HashtagCommands.convertOperation(
            ["show", "imagecontainer", "bg", "[", "anything1", "anything2", "]"],
            step,
        ),
    ).toEqual({
        type: "imagecontainer",
        operationType: "show",
        alias: "bg",
        urls: ["anything1", "anything2"],
    });

    HashtagCommands.clearMappers();
});

test("end-to-end: 'show imagecontainer' with a quoted url glued to '[' tokenizes and validates correctly", () => {
    HashtagCommands.clearMappers();
    addBaseHashtagCommands();
    const step = {} as unknown as PixiVNJsonLabelStep;

    const list = HashtagCommands.convertTagTolist(
        'show imagecontainer bg ["/image A.png" image  ] x 10 y 20 with dissolve',
    );

    expect(HashtagCommands.convertOperation(list, step)).toEqual({
        type: "imagecontainer",
        operationType: "show",
        alias: "bg",
        urls: ["/image A.png", "image"],
        transition: { type: "dissolve" },
        props: { x: 10, y: 20 },
    });

    HashtagCommands.clearMappers();
});

// ── mergeInkVariables (Vite plugin path) ────────────────────────────────────

test("convertTagTolist mergeInkVariables: { varname } becomes a single token", () => {
    expect(
        HashtagCommands.convertTagTolist("pause sound { myvalue }", {
            mergeInkVariables: true,
        }),
    ).toEqual(["pause", "sound", "§INK_VAR§"]);
});

test("convertTagTolist mergeInkVariables: nested Ink variable becomes a single token", () => {
    expect(
        HashtagCommands.convertTagTolist("pause sound { obj.{ nested } }", {
            mergeInkVariables: true,
        }),
    ).toEqual(["pause", "sound", "§INK_VAR§"]);
});

test("convertTagTolist mergeInkVariables: escaped \\{ \\} are NOT merged", () => {
    // \{ and \} are escaped: they should stay as literal { and } chars
    // inside their token, not be collapsed into a single placeholder
    const withMerge = HashtagCommands.convertTagTolist("pause sound \\{ myvalue \\}", {
        mergeInkVariables: true,
    });
    const withoutMerge = HashtagCommands.convertTagTolist("pause sound \\{ myvalue \\}");
    expect(withMerge).toEqual(withoutMerge);
});

test("convertTagTolist mergeInkVariables: valid JSON object is still merged by mergeJsonBlocks", () => {
    // { "x": 1 } is valid JSON5, mergeJsonBlocks handles it before mergeInkVariables runs
    expect(
        HashtagCommands.convertTagTolist('edit image bg position { "x": 1 }', {
            mergeInkVariables: true,
        }),
    ).toEqual(["edit", "image", "bg", "position", '{ "x": 1 }']);
});

test("convertTagTolist without mergeInkVariables: { varname } stays split (runtime behavior unchanged)", () => {
    expect(HashtagCommands.convertTagTolist("pause sound { myvalue }")).toEqual([
        "pause",
        "sound",
        "{",
        "myvalue",
        "}",
    ]);
});

// ── getUnknownHashtagCommands with Ink variables ─────────────────────────────

const pauseSoundCommand: InkHashtagCommandInfo = {
    name: "pause-sound",
    validation: {
        type: "zod",
        schema: {
            type: "array",
            prefixItems: [
                { type: "string", const: "pause" },
                { type: "string", const: "sound" },
                { type: "string" },
            ],
            minItems: 3,
            maxItems: 3,
            items: false,
        },
    },
};

test("getUnknownHashtagCommands: pause sound { varname } is not unknown", () => {
    const source = "=== start ===\n# pause sound { myvalue }\n";
    const unknown = InkCompiler.getUnknownHashtagCommands(source, [pauseSoundCommand]);
    expect(unknown).toHaveLength(0);
});

test("getUnknownHashtagCommands: pause sound { obj.field } is not unknown", () => {
    const source = "=== start ===\n# pause sound { obj.field }\n";
    const unknown = InkCompiler.getUnknownHashtagCommands(source, [pauseSoundCommand]);
    expect(unknown).toHaveLength(0);
});

test("getUnknownHashtagCommands: pause sound static_alias is not unknown", () => {
    const source = "=== start ===\n# pause sound my_sound\n";
    const unknown = InkCompiler.getUnknownHashtagCommands(source, [pauseSoundCommand]);
    expect(unknown).toHaveLength(0);
});

test("getUnknownHashtagCommands: unregistered command is still reported as unknown", () => {
    const source = "=== start ===\n# pause sound { myvalue }\n";
    const unknown = InkCompiler.getUnknownHashtagCommands(source, []);
    expect(unknown).toHaveLength(1);
    expect(unknown[0].command).toBe("pause sound { myvalue }");
});

// ── regression: `# rename <id> { _input_value_ }` (Ink variable as 3rd token) ─

test("convertTagTolist mergeInkVariables: { _input_value_ } collapses to a single token", () => {
    // This mirrors `# rename mc { _input_value_ }`, where `{ _input_value_ }` is an Ink
    // variable interpolation resolved by inkjs at runtime, not yet evaluated when the raw
    // source is statically scanned for unknown hashtag commands.
    expect(
        HashtagCommands.convertTagTolist("rename mc { _input_value_ }", {
            mergeInkVariables: true,
        }),
    ).toEqual(["rename", "mc", "§INK_VAR§"]);
});

test("getUnknownHashtagCommands: `rename <enum-id> { _input_value_ }` is not unknown", () => {
    // Same shape as the app-level "character rename" command:
    // zod.tuple([zod.literal("rename"), zod.enum(characterIds), zod.string()])
    const renameCommand: InkHashtagCommandInfo = {
        name: "character rename",
        validation: {
            type: "zod",
            schema: z.toJSONSchema(
                z.tuple([z.literal("rename"), z.enum(["mc", "james"]), z.string()]),
            ) as Record<string, unknown>,
        },
    };
    const source = "=== start ===\n# rename mc { _input_value_ }\n";
    const unknown = InkCompiler.getUnknownHashtagCommands(source, [renameCommand]);
    expect(unknown).toHaveLength(0);
});

test("converting a `.ink` script does not log a false 'not valid' error for a command registered only via HashtagCommands.add", () => {
    // End-to-end regression test for the bug where every custom hashtag command (registered via
    // `.add()`, e.g. app-specific commands or `createNqtrHandler`'s room/quest/activity
    // commands) logged a spurious "The operation is not valid" error on every single `.ink`
    // parse — even though the command works perfectly once actually run. The parser
    // speculatively checks the built-in mapper table before deferring to `operationtoconvert`
    // (resolved later via the full `run()` pipeline, which does check `.add()` handlers); that
    // speculative check must stay silent on a miss.
    HashtagCommands.add(
        () => true,
        { name: "enter-room-test", validation: z.tuple([z.literal("enter"), z.literal("room"), z.string()]) },
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
        convertInkToJson("=== start ===\n# enter room mc_room\nHello!\n");
    } finally {
        HashtagCommands.clear();
    }

    expect(errorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("The operation is not valid"),
        expect.anything(),
    );
});
