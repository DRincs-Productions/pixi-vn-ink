import { convertInkToJson, convertJsonToInk } from "@/converter";
import { PIXIVNJSON_SCHEMA_URL, type PixiVNJson } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";
import { expectJsonInkRoundTrip } from "./json-to-ink-utils";

/** Ink sources that must survive Ink → JSON → Ink → JSON unchanged. */
const sources: Record<string, string> = {
    "tag after dialogue with a trailing space": `-> k
=== k ===
Hello # tag one
# top tag
World
-> END
`,
    "pixi'vn hashtag command after dialogue with a trailing space": `-> k
=== k ===
Hello # show image bg "x.png"
-> END
`,
    "request input tag after a question": `-> k
=== k ===
Name? # request input
-> END
`,
    "temp variables declared once": `-> k
=== k ===
~ temp x = 5
~ x = x + 1
Value {x}
-> END
`,
    "choice echo followed by dialogue": `-> k
=== k ===
* A
  a text
* B
  b text
- done
-> END
`,
    "choice echo followed by nested choices": `-> k
=== k ===
* A
  * * B
    * * * C
      end
-> END
`,
    "tunnel with parameters": `-> k
=== k ===
-> t(2) ->
back
-> END
=== t(n) ===
{n}
->->
`,
    "constant switch": `VAR a = 1
-> k
=== k ===
{ a:
- 1: one
- 2: two
- else: other
}
-> END
`,
    "labelled choice read by a later choice": `-> k
=== k ===
* (first) [A] -> END
* {first} [B] -> END
`,
    "sequences, cycles and shuffles": `-> k
=== k ===
{&a|b|c}
{~x|y}
{!once|twice}
-> END
`,
    "multiline alternatives": `-> k
=== k ===
{ cycle:
- a
- b
}
{ shuffle:
- c
- d
}
{ once:
- e
- f
}
-> END
`,
    "conditions with and, or and not": `VAR a = 1
VAR b = 2
-> k
=== k ===
{ a > 0 and b > 0: both }
{ a > 5 or b > 1: either }
{ not a: no }
-> END
`,
    "knot and stitch parameters": `-> k.s(1)
=== k ===
= s(a)
{a}
-> j(a + 1)
=== j(b) ===
{b}
-> END
`,
    "lists": `LIST L = a, b, c
VAR s = (a)
-> k
=== k ===
~ s += b
~ s -= a
{s}
-> END
`,
    "threads with parameters": `-> k
=== k ===
<- t(2)
main
-> DONE
=== t(n) ===
* [x{n}] -> DONE
`,
    "character dialogue with emotion": `-> k
=== k ===
alice@happy: Hi
-> END
`,
};

for (const [name, source] of Object.entries(sources)) {
    test(`round-trips ${name}`, () => {
        const json = convertInkToJson(source);
        expect(json).toBeDefined();
        expectJsonInkRoundTrip(json);
    });
}

test("emits a repeated temp assignment without redeclaring it", () => {
    const ink = convertJsonToInk(convertInkToJson(sources["temp variables declared once"])!);
    expect(ink.match(/~ temp x/g)).toHaveLength(1);
    expect(ink).toContain("~ x = ");
});

test("emits a tunnel return for called labels", () => {
    const ink = convertJsonToInk(convertInkToJson(sources["tunnel with parameters"])!);
    expect(ink).toContain("->->");
});

test("emits a trailing-space tag on the dialogue line", () => {
    const ink = convertJsonToInk(convertInkToJson(sources["tag after dialogue with a trailing space"])!);
    expect(ink).toContain("Hello # tag one");
});

test("throws a path-specific error for dialogue whose trailing space Ink would trim", () => {
    const json: PixiVNJson = {
        $schema: PIXIVNJSON_SCHEMA_URL,
        labels: { k: [{ dialogue: "Text " }, { dialogue: "next" }] },
    };
    expect(() => convertJsonToInk(json)).toThrow("labels.k[0].dialogue");
});
