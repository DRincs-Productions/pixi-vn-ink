import { convertInkToJson } from "@/loader";
import { CharacterBaseModel, RegisteredCharacters } from "@drincs/pixi-vn";
import { describe, expect, test } from "vitest";
import { expectJsonInkRoundTrip } from "./json-to-ink-utils";

/**
 * Regression tests for #123: `characterId: text` speakers must resolve when the characters are
 * passed to the converter, even if they are not in the global `RegisteredCharacters` registry.
 * The ids used here (`bob`, `zoe`) are intentionally never registered globally in the suite.
 */
describe("#123 resolve characterId speaker when characters are passed to the converter", () => {
    test("attaches the character even though it is NOT in RegisteredCharacters", () => {
        expect(RegisteredCharacters.has("bob")).toBe(false);

        const res = convertInkToJson(`\n=== start ===\nbob: Hi\n-> DONE\n`, {
            characters: ["bob"],
        });

        expect(res?.labels?.start[0].dialogue).toEqual({ character: "bob", text: "Hi" });
        expectJsonInkRoundTrip(res, {
            characters: ["bob"],
        });
    });

    test("accepts character-like objects (e.g. RegisteredCharacters.values())", () => {
        expect(RegisteredCharacters.has("zoe")).toBe(false);

        const res = convertInkToJson(`\n=== start ===\nzoe: Hello there.\n-> DONE\n`, {
            characters: [{ id: "zoe" }],
        });

        expect(res?.labels?.start[0].dialogue).toEqual({ character: "zoe", text: "Hello there." });
        expectJsonInkRoundTrip(res, {
            characters: [{ id: "zoe" }],
        });
    });

    test("keeps the first ': ' split so a sentence with extra colons stays intact", () => {
        const res = convertInkToJson(`\n=== start ===\nbob: I see it: a clue.\n-> DONE\n`, {
            characters: ["bob"],
        });

        expect(res?.labels?.start[0].dialogue).toEqual({
            character: "bob",
            text: "I see it: a clue.",
        });
        expectJsonInkRoundTrip(res, {
            characters: ["bob"],
        });
    });

    test("does NOT split an unknown prefix (no false-positive speaker on plain colons)", () => {
        const res = convertInkToJson(`\n=== start ===\nNote: remember this\n-> DONE\n`, {
            characters: ["bob"],
        });

        // "Note" is not a known character, so the line stays a narrator line, prefix included.
        expect(res?.labels?.start[0].dialogue).toBe("Note: remember this");
        expectJsonInkRoundTrip(res, {
            characters: ["bob"],
        });
    });

    test("without the option and without a global registration, the prefix is left as text", () => {
        // Documents the pre-fix behaviour: nothing knows about `bob`, so no split happens.
        expect(RegisteredCharacters.has("bob")).toBe(false);

        const res = convertInkToJson(`\n=== start ===\nbob: Hi\n-> DONE\n`);

        expect(res?.labels?.start[0].dialogue).toBe("bob: Hi");
        expectJsonInkRoundTrip(res);
    });

    test("still honours the global RegisteredCharacters registry (no regression)", () => {
        const carol = new CharacterBaseModel("carol", { name: "Carol" });
        RegisteredCharacters.add(carol);

        const res = convertInkToJson(`\n=== start ===\ncarol: Hi\n-> DONE\n`);

        expect(res?.labels?.start[0].dialogue).toEqual({ character: "carol", text: "Hi" });
        expectJsonInkRoundTrip(res);
    });

    test("merges the passed characters with the global registry", () => {
        const dave = new CharacterBaseModel("dave", { name: "Dave" });
        RegisteredCharacters.add(dave);
        expect(RegisteredCharacters.has("bob")).toBe(false);

        const res = convertInkToJson(
            `\n=== start ===\ndave: From the registry.\nbob: From the option.\n-> DONE\n`,
            { characters: ["bob"] },
        );

        expect(res?.labels?.start[0].dialogue).toEqual({
            character: "dave",
            text: "From the registry.",
        });
        expect(res?.labels?.start[1].dialogue).toEqual({
            character: "bob",
            text: "From the option.",
        });
        expectJsonInkRoundTrip(res, { characters: ["bob"] });
    });
});
