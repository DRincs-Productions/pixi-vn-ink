import { expect, test } from "vitest";
import { generateJsonInkTranslation, PixiVNJson } from "../src";

test("Translate test 1", async () => {
    let input: PixiVNJson = {
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
    let expected = {
        "We arrived into London at 9.45pm exactly.": "We arrived into London at 9.45pm exactly.",
        "We hurried home to Savile Row as fast as we could.": "We hurried home to Savile Row as fast as we could.",
    };
    let res = {};
    generateJsonInkTranslation(input, res);
    expect(res).toEqual(expected);
});
