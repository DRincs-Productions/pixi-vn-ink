import { beforeEach, expect, test, vi } from "vitest";
vi.hoisted(() => vi.resetModules());
const mocks = vi.hoisted(() => ({ operation: vi.fn() }));
vi.mock("@drincs/pixi-vn-json/actions", async (original) => ({
    ...await original<typeof import("@drincs/pixi-vn-json/actions")>(),
    animatedSpriteOperation: mocks.operation,
}));
import { HashtagCommands, addBaseHashtagCommands } from "@/handlers/hashtag-commands";
import { convertInkToJson } from "@/loader";

beforeEach(() => {
    vi.clearAllMocks();
    HashtagCommands.clear();
    addBaseHashtagCommands();
});

test("show maps source, display options and transitions to the JSON operation", async () => {
    await HashtagCommands.run("show asprite hero heroSheet animation walk useFrameDurations true loop false with dissolve duration 2", {}, {});
    expect(mocks.operation).toHaveBeenCalledWith({
        type: "asprite",
        operationType: "show",
        alias: "hero",
        source: { spritesheet: "heroSheet", animation: "walk", useFrameDurations: true },
        props: { loop: false },
        transition: { type: "dissolve", props: { duration: 2 } },
    });
});

test("pause, resume, goto, edit and remove delegate to JSON operations", async () => {
    for (const command of ["pause asprite hero", "resume asprite hero", "goto asprite hero 3", "edit asprite hero animationSpeed 0.5", "remove asprite hero with moveout duration 1"]) {
        await HashtagCommands.run(command, {}, {});
    }
    expect(mocks.operation.mock.calls.map(([operation]) => operation)).toEqual([
        { type: "asprite", operationType: "pause", alias: "hero" },
        { type: "asprite", operationType: "resume", alias: "hero" },
        { type: "asprite", operationType: "goto", alias: "hero", frame: 3 },
        { type: "asprite", operationType: "edit", alias: "hero", props: { animationSpeed: 0.5 } },
        {
            type: "asprite",
            operationType: "remove",
            alias: "hero",
            transition: { type: "moveout", props: { duration: 1 } },
        },
    ]);
});

test("compilation defers animated sprite commands until runtime", () => {
    const result = convertInkToJson("=== start ===\n# show asprite hero animation walk\nHello!\n");
    expect(JSON.stringify(result)).toContain("operationtoconvert");
    expect(JSON.stringify(result)).toContain("show asprite hero");
});

test("show supports alias defaults and explicit frame lists", async () => {
    await HashtagCommands.run("show asprite hero animation walk", {}, {});
    expect(mocks.operation).toHaveBeenLastCalledWith({
        type: "asprite",
        operationType: "show",
        alias: "hero",
        source: { animation: "walk" },
        props: {},
    });
    await HashtagCommands.run("show asprite hero heroSheet frames [ open.png closed.png ]", {}, {});
    expect(mocks.operation).toHaveBeenLastCalledWith({
        type: "asprite",
        operationType: "show",
        alias: "hero",
        source: { spritesheet: "heroSheet", frames: ["open.png", "closed.png"] },
        props: {},
    });
});
