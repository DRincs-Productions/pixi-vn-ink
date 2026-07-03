import { convertInkText } from "@/loader";
import { PIXIVNJSON_SCHEMA_URL, type PixiVNJson } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";

// Regression test for a multi-way value switch (`{ x: -0:.. -1:.. -2:.. -3:.. -else:.. }`)
// diverting to sibling stitches. Ink compiles this into a flat chain of sibling
// equality-check blocks (all at the same container depth), not into genuinely nested
// containers. The mapper used to treat every switch branch like a real nested
// `{cond: A - else: {cond2: B}}` conditional and kept appending "_|_else" to the label
// key for each remaining case, which desynced it from the divert's fixed "up" count and
// produced dangling "else" segments (e.g. "talk_alice_|_else_|_talk_alice2") for the
// third and later cases instead of the real label "talk_alice_|_talk_alice2".
test("switch case 3+ diverting to a sibling stitch resolves to the correct label", () => {
    const res = convertInkText(`
=== talk_alice ===
{ aliceQuest_currentStageIndex:
- 0: 	-> talk_alice0
- 1: 	-> talk_alice1
- 2: 	-> talk_alice2
- 3: 	-> talk_alice3
- else: alice: Thanks for the book.
}
-> DONE

= talk_alice0
alice: Hi, can you order me a new book from pc?
mc: Ok
alice: Thanks
-> DONE

= talk_alice1
mc: What book do you want me to order?
alice: For me it is the same.
-> DONE

= talk_alice2
mc: I ordered the Book, hope you enjoy it.
alice: Great, when it arrives remember to bring it to me.
-> DONE

= talk_alice3
mc: Here's your book.
alice: Thank you, I can finally read something new.
-> DONE
`);

    const talkAlice = res?.labels?.talk_alice;
    expect(talkAlice).toBeDefined();
    const step = talkAlice?.[0] as any;
    // Walk the nested conditionalStep chain down to the case-2 and case-3 branches.
    const case2 = step.conditionalStep.else.conditionalStep.else.conditionalStep;
    const case3 = case2.else.conditionalStep;

    expect(case2.then).toEqual({
        labelToOpen: { label: "talk_alice_|_talk_alice2", type: "jump" },
    });
    expect(case3.then).toEqual({
        labelToOpen: { label: "talk_alice_|_talk_alice3", type: "jump" },
    });

    expect(Object.keys(res?.labels ?? {})).toEqual(
        expect.arrayContaining([
            "talk_alice_|_talk_alice0",
            "talk_alice_|_talk_alice1",
            "talk_alice_|_talk_alice2",
            "talk_alice_|_talk_alice3",
            "talk_alice",
        ]),
    );

    const expected: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: {
            "talk_alice_|_talk_alice0": [
                { dialogue: "alice: Hi, can you order me a new book from pc?" },
                { dialogue: "mc: Ok" },
                { dialogue: "alice: Thanks" },
                { end: "label_end", goNextStep: true },
            ],
            "talk_alice_|_talk_alice1": [
                { dialogue: "mc: What book do you want me to order?" },
                { dialogue: "alice: For me it is the same." },
                { end: "label_end", goNextStep: true },
            ],
            "talk_alice_|_talk_alice2": [
                { dialogue: "mc: I ordered the Book, hope you enjoy it." },
                { dialogue: "alice: Great, when it arrives remember to bring it to me." },
                { end: "label_end", goNextStep: true },
            ],
            "talk_alice_|_talk_alice3": [
                { dialogue: "mc: Here's your book." },
                { dialogue: "alice: Thank you, I can finally read something new." },
                { end: "label_end", goNextStep: true },
            ],
            talk_alice: [
                {
                    conditionalStep: {
                        type: "ifelse",
                        condition: {
                            type: "compare",
                            operator: "==",
                            rightValue: 0,
                            leftValue: {
                                type: "value",
                                storageOperationType: "get",
                                storageType: "storage",
                                key: "aliceQuest_currentStageIndex",
                            },
                        },
                        then: {
                            labelToOpen: { label: "talk_alice_|_talk_alice0", type: "jump" },
                        },
                        else: {
                            conditionalStep: {
                                type: "ifelse",
                                condition: {
                                    type: "compare",
                                    operator: "==",
                                    rightValue: 1,
                                    leftValue: {
                                        type: "value",
                                        storageOperationType: "get",
                                        storageType: "storage",
                                        key: "aliceQuest_currentStageIndex",
                                    },
                                },
                                then: {
                                    labelToOpen: {
                                        label: "talk_alice_|_talk_alice1",
                                        type: "jump",
                                    },
                                },
                                else: {
                                    conditionalStep: {
                                        type: "ifelse",
                                        condition: {
                                            type: "compare",
                                            operator: "==",
                                            rightValue: 2,
                                            leftValue: {
                                                type: "value",
                                                storageOperationType: "get",
                                                storageType: "storage",
                                                key: "aliceQuest_currentStageIndex",
                                            },
                                        },
                                        then: {
                                            labelToOpen: {
                                                label: "talk_alice_|_talk_alice2",
                                                type: "jump",
                                            },
                                        },
                                        else: {
                                            conditionalStep: {
                                                type: "ifelse",
                                                condition: {
                                                    type: "compare",
                                                    operator: "==",
                                                    rightValue: 3,
                                                    leftValue: {
                                                        type: "value",
                                                        storageOperationType: "get",
                                                        storageType: "storage",
                                                        key: "aliceQuest_currentStageIndex",
                                                    },
                                                },
                                                then: {
                                                    labelToOpen: {
                                                        label: "talk_alice_|_talk_alice3",
                                                        type: "jump",
                                                    },
                                                },
                                                else: {
                                                    dialogue: "alice: Thanks for the book.",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                { end: "label_end", goNextStep: true },
            ],
        },
        initialOperations: [],
    };
    expect(res).toEqual(expected);
});
