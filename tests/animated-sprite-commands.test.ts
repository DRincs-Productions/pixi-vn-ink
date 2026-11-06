import { beforeEach, expect, test, vi } from "vitest";
vi.hoisted(() => vi.resetModules());
const mocks = vi.hoisted(() => ({ show: vi.fn(), find: vi.fn(), remove: vi.fn(), transition: vi.fn() }));
vi.mock("@drincs/pixi-vn/canvas", async (original) => {
    const actual = await original<typeof import("@drincs/pixi-vn/canvas")>();
    return { ...actual, showAnimatedSprite: mocks.show, canvas: { ...actual.canvas, find: mocks.find } };
});
vi.mock("@drincs/pixi-vn-json/actions", async (original) => ({
    ...await original<typeof import("@drincs/pixi-vn-json/actions")>(),
    canvasElementOperation: mocks.remove,
    executeEntranceTransition: mocks.transition,
}));
import { AnimatedSprite } from "@drincs/pixi-vn/canvas";
import { HashtagCommands, addBaseHashtagCommands } from "@/handlers/hashtag-commands";
import { convertInkToJson } from "@/loader";

beforeEach(() => {
    vi.clearAllMocks();
    HashtagCommands.clear();
    addBaseHashtagCommands();
});

test("show separates spritesheet source, timing and display options and reuses transitions", async () => {
    const component = Object.create(AnimatedSprite.prototype);
    mocks.show.mockResolvedValue(component);
    await HashtagCommands.run("show asprite hero heroSheet animation walk useFrameDurations true loop false with dissolve duration 2", {}, {});
    expect(mocks.show).toHaveBeenCalledWith("hero", { spritesheet: "heroSheet", animation: "walk", useFrameDurations: true }, { loop: false });
    expect(mocks.transition).toHaveBeenCalledWith("hero", component, "dissolve", { duration: 2 });
});

test("pause, resume, goto, edit and remove operate on the component", async () => {
    const component = Object.create(AnimatedSprite.prototype);
    Object.defineProperties(component, {
        stop: { value: vi.fn() }, play: { value: vi.fn() }, setFrame: { value: vi.fn() },
    });
    mocks.find.mockReturnValue(component);
    for (const command of ["pause asprite hero", "resume asprite hero", "goto asprite hero 3", "edit asprite hero animationSpeed 0.5", "remove asprite hero with moveout duration 1"]) {
        await HashtagCommands.run(command, {}, {});
    }
    expect(component.stop).toHaveBeenCalledOnce();
    expect(component.play).toHaveBeenCalledOnce();
    expect(component.setFrame).toHaveBeenCalledWith(3);
    expect(component.animationSpeed).toBe(0.5);
    expect(mocks.remove).toHaveBeenCalledWith({
        type: "canvaselement",
        operationType: "remove",
        alias: "hero",
        transition: { type: "moveout", props: { duration: 1 } },
    });
});

test("compilation defers animated sprite commands until runtime", () => {
    const result = convertInkToJson("=== start ===\n# show asprite hero animation walk\nHello!\n");
    expect(JSON.stringify(result)).toContain("operationtoconvert");
    expect(JSON.stringify(result)).toContain("show asprite hero");
});

test("show supports alias defaults and explicit frame lists", async () => {
    await HashtagCommands.run("show asprite hero animation walk", {}, {});
    expect(mocks.show).toHaveBeenLastCalledWith("hero", { animation: "walk" }, {});
    await HashtagCommands.run("show asprite hero heroSheet frames [ open.png closed.png ]", {}, {});
    expect(mocks.show).toHaveBeenLastCalledWith("hero", { spritesheet: "heroSheet", frames: ["open.png", "closed.png"] }, {});
});
