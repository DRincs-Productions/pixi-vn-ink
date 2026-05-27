import { CharacterBaseModel, RegisteredCharacters } from "@drincs/pixi-vn";
import { PIXIVNJSON_SCHEMA_URL, TextReplaces } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";
import { generateJsonInkTranslation, type PixiVNJson } from "../src";

test("Translate test 1", async () => {
    const input: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            back_in_london: [
                {
                    dialogue: "We arrived into London at 9.45pm exactly.",
                },
                {
                    labelToOpen: {
                        label: "hurry_home",
                        type: "jump",
                    },
                },
            ],
            hurry_home: [
                {
                    dialogue: "We hurried home to Savile Row as fast as we could.",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const expected = {
        "We arrived into London at 9.45pm exactly.": "We arrived into London at 9.45pm exactly.",
        "We hurried home to Savile Row as fast as we could.":
            "We hurried home to Savile Row as fast as we could.",
    };
    const res = {};
    generateJsonInkTranslation(input, res);
    expect(res).toEqual(expected);
});

test("Translate test - after-translation with i18nInterpolation", async () => {
    const sly = new CharacterBaseModel("sly", { name: "Sly" });
    RegisteredCharacters.add(sly);

    const fn = (key: string) => RegisteredCharacters.get<CharacterBaseModel>(key)?.name;
    TextReplaces.add(fn, {
        name: "character name",
        validation: "characterId",
        type: "after-translation",
        i18nInterpolation: true,
        description: "Replaces a character ID with the character's name in the game.",
    });

    const input: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    dialogue: "[sly] thrusts her hand out to shake mine.",
                },
            ],
        },
    };
    const expected = {
        "[sly] thrusts her hand out to shake mine.": "{{[sly]}} thrusts her hand out to shake mine.",
    };
    const res = {};
    await generateJsonInkTranslation(input, res);
    expect(res).toEqual(expected);

    TextReplaces.remove(fn);
});

test("Translate test - before-translation", async () => {
    const sly = new CharacterBaseModel("sly", { name: "Sly" });
    RegisteredCharacters.add(sly);

    const fn = (key: string) => RegisteredCharacters.get<CharacterBaseModel>(key)?.name;
    TextReplaces.add(fn, {
        name: "character name",
        validation: "characterId",
        type: "before-translation",
        description: "Replaces a character ID with the character's name in the game.",
        i18nInterpolation: true,
    });

    const input: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    dialogue: "[sly] thrusts her hand out to shake mine.",
                },
            ],
        },
    };
    const expected = {
        "[sly] thrusts her hand out to shake mine.": "{{Sly}} thrusts her hand out to shake mine.",
    };
    const res = {};
    await generateJsonInkTranslation(input, res);
    expect(res).toEqual(expected);

    TextReplaces.remove(fn);
});
