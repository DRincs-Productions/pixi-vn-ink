import { convertInkText } from "@/loader";
import { PIXIVNJSON_SCHEMA_URL, type PixiVNJson } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";

test("Empty file test", async () => {
    const res = convertInkText(``);
    expect(res).toEqual({
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {},
    });
});

test("Test elements not considered", async () => {
    const res = convertInkText(`
"What do you make of this?" she asked.

// Something unprintable...

"I couldn't possibly comment," I replied.

/*
	... or an unlimited block of text
*/
`);
    expect(res).toEqual({
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {},
    });
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#comments
 * TODO comments are compiler notes; they are not emitted as content.
 */
test("TODO compiler note is ignored", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    dialogue: "This is some text.",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const res = convertInkText(`
=== start ===
This is some text.
TODO: Add more content here.
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#script-files-can-be-combined
 * The file handler always returns an empty string, so included files contribute no content.
 * This is syntax that is ignored / not yet fully supported by PixiVN.
 */
test("INCLUDE statement loads empty file", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    dialogue: "Hello world!",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const res = convertInkText(`
INCLUDE other_file.ink

=== start ===
Hello world!
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#randommin-max
 */
test("exterlan temp variable", async () => {
    const res = convertInkText(`
~ temp dice_roll = RANDOM(1, 6)

~ temp lazy_grading_for_test_paper = RANDOM(30, 75)

~ temp number_of_heads_the_serpent_has = RANDOM(3, 8)
`);
    expect(res).toEqual({
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {},
    });
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#seed_random
 * SEED_RANDOM() is silently ignored by PixiVN – it is syntax that PixiVN does not need.
 * See https://pixi-vn.com/ink#syntax-ignored-by-pixivn
 */
test("SEED_RANDOM is silently ignored", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    dialogue: "The coin is heads.",
                },
                {
                    end: "label_end",
                    goNextStep: true,
                },
            ],
        },
    };
    const res = convertInkText(`
=== start ===
~ SEED_RANDOM(235)
The coin is heads.
-> DONE
`);
    expect(res).toEqual(expected);
});
