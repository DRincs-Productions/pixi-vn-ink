import { PIXIVNJSON_SCHEMA_URL } from "@drincs/pixi-vn-json";
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
