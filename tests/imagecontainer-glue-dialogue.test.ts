import { convertInkText } from "@/loader";
import { PIXIVNJSON_SCHEMA_URL, type PixiVNJson } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";

/**
 * A common visual-novel pattern: each dialogue line is preceded by its own
 * `# show imagecontainer <id> [...]` tag that swaps the character's body/eyes/mouth
 * combo, and consecutive lines from the same speaker are joined with a leading `<>`
 * instead of repeating `james:`. The glue must still attach to the previous step
 * (the imagecontainer operation step, which has no dialogue of its own) and suppress
 * the click between the tag step and the glued line.
 */
test("show imagecontainer tag per line, with glue joining consecutive dialogue from the same character", async () => {
    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            start: [
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "imagecontainer",
                            operationType: "show",
                            alias: "james",
                            urls: ["m01-body", "m01-eyes-smile", "m01-mouth-grin00"],
                            $origin: "show imagecontainer james [m01-body m01-eyes-smile m01-mouth-grin00]",
                        },
                    ],
                },
                {
                    dialogue: "I take his hand and shake.",
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "imagecontainer",
                            operationType: "show",
                            alias: "james",
                            urls: ["m01-body", "m01-eyes-wow", "m01-mouth-wow01"],
                            $origin: "show imagecontainer james [m01-body m01-eyes-wow m01-mouth-wow01]",
                        },
                    ],
                },
                {
                    dialogue: "james: Ooh, [mc]! Nice, firm handshake!",
                },
                {
                    goNextStep: true,
                    glueEnabled: true,
                    operations: [
                        {
                            type: "imagecontainer",
                            operationType: "show",
                            alias: "james",
                            urls: ["m01-body", "m01-eyes-annoy", "m01-mouth-annoy01"],
                            $origin: "show imagecontainer james [m01-body m01-eyes-annoy m01-mouth-annoy01]",
                        },
                    ],
                },
                {
                    dialogue: "The last guy always gave me the dead fish.",
                },
                {
                    goNextStep: true,
                    glueEnabled: true,
                    operations: [
                        {
                            type: "imagecontainer",
                            operationType: "show",
                            alias: "james",
                            urls: ["m01-body", "m01-eyes-smile", "m01-mouth-smile01"],
                            $origin: "show imagecontainer james [m01-body m01-eyes-smile m01-mouth-smile01]",
                        },
                    ],
                },
                {
                    dialogue: "I already think we're gonna get along fine.",
                },
                {
                    goNextStep: true,
                    operations: [
                        {
                            type: "imagecontainer",
                            operationType: "show",
                            alias: "james",
                            urls: ["m01-body", "m01-eyes-grin", "m01-mouth-smile01"],
                            $origin: "show imagecontainer james [m01-body m01-eyes-grin m01-mouth-smile01]",
                        },
                    ],
                },
                {
                    dialogue: "james: Come on in and...",
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
# show imagecontainer james [m01-body m01-eyes-smile m01-mouth-grin00]
I take his hand and shake.

# show imagecontainer james [m01-body m01-eyes-wow m01-mouth-wow01]
james: Ooh, [mc]! Nice, firm handshake!
# show imagecontainer james [m01-body m01-eyes-annoy m01-mouth-annoy01]
<>The last guy always gave me the dead fish.
# show imagecontainer james [m01-body m01-eyes-smile m01-mouth-smile01]
<>I already think we're gonna get along fine.
# show imagecontainer james [m01-body m01-eyes-grin m01-mouth-smile01]
james: Come on in and...
-> DONE
`);

    expect(res).toEqual(expected);
});
