import { TextReplaces } from "@/functions";
import { CharacterBaseModel, RegisteredCharacters } from "@drincs/pixi-vn";
import { expect, test } from "vitest";
import { z } from "zod";

test("TextReplaces applies RegExp validation", () => {
    const handler = (key: string) => (key === "name" ? "Mario" : undefined);
    TextReplaces.add(handler, {
        name: "regex-handler",
        validation: /^name$/,
    });

    const result = TextReplaces.replace("Hello [name] [surname]", { type: "before-translation" });
    expect(result).toBe("Hello Mario [surname]");

    TextReplaces.remove(handler);
});

test("TextReplaces applies Zod validation", () => {
    const handler = (key: string) => key.toUpperCase();
    TextReplaces.add(handler, {
        name: "zod-handler",
        validation: z.enum(["player", "npc"]),
    });

    const result = TextReplaces.replace("A [player] B [npc] C [enemy]", {
        type: "before-translation",
    });
    expect(result).toBe("A PLAYER B NPC C [enemy]");

    TextReplaces.remove(handler);
});

test("TextReplaces applies characterId validation", () => {
    const characterId = `test_character_${Date.now()}`;
    RegisteredCharacters.add(
        new CharacterBaseModel(characterId, {
            name: "Test Character",
        }),
    );

    const handler = (key: string) => `<${key}>`;
    TextReplaces.add(handler, {
        name: "character-id-handler",
        validation: "characterId",
    });

    const result = TextReplaces.replace(`Hi [${characterId}] [unknown]`, {
        type: "before-translation",
    });
    expect(result).toBe(`Hi <${characterId}> [unknown]`);

    TextReplaces.remove(handler);
});
