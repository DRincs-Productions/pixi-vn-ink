import { HashtagCommands } from "@/handlers/hashtag-commands";
import { InkCompiler } from "@/parser";
import type { InkHashtagCommandInfo } from "@/parser/types";
import { expect, test } from "vitest";

// ── extractKeyedSections ───────────────────────────────────────────────────────

test("extractKeyedSections splits the 'show imagecontainer ... props ... movein ...' example", () => {
    // # show imagecontainer sly props xAlign 0.2 yAlign 1 movein direction right ease anticipate
    const tokens = [
        "show",
        "imagecontainer",
        "sly",
        "props",
        "xAlign",
        "0.2",
        "yAlign",
        "1",
        "movein",
        "direction",
        "right",
        "ease",
        "anticipate",
    ];
    expect(InkCompiler.extractKeyedSections(tokens, ["props", "movein"])).toEqual([
        { key: "props", sectionTokens: ["xAlign", "0.2", "yAlign", "1"] },
        { key: "movein", sectionTokens: ["direction", "right", "ease", "anticipate"] },
    ]);
});

test("extractKeyedSections: a key at index 0 captures the rest of the array (the 'wait' example)", () => {
    // # wait hours 3 days "2024-01-01"
    const tokens = ["wait", "hours", "3", "days", "2024-01-01"];
    expect(InkCompiler.extractKeyedSections(tokens, ["wait"])).toEqual([
        { key: "wait", sectionTokens: ["hours", "3", "days", "2024-01-01"] },
    ]);
});

test("extractKeyedSections returns an empty array when no key is present", () => {
    expect(InkCompiler.extractKeyedSections(["show", "image", "bg"], ["props", "movein"])).toEqual(
        [],
    );
});

test("extractKeyedSections ignores tokens before the left-most matched key", () => {
    const tokens = ["show", "imagecontainer", "sly", "props", "xAlign", "0.2"];
    expect(InkCompiler.extractKeyedSections(tokens, ["props", "movein"])).toEqual([
        { key: "props", sectionTokens: ["xAlign", "0.2"] },
    ]);
});

test("extractKeyedSections: a key immediately followed by another key gets an empty section", () => {
    const tokens = ["props", "movein", "direction", "right"];
    expect(InkCompiler.extractKeyedSections(tokens, ["props", "movein"])).toEqual([
        { key: "props", sectionTokens: [] },
        { key: "movein", sectionTokens: ["direction", "right"] },
    ]);
});

test("extractKeyedSections: a trailing key with nothing after it gets an empty section", () => {
    const tokens = ["props", "xAlign", "0.2", "movein"];
    expect(InkCompiler.extractKeyedSections(tokens, ["props", "movein"])).toEqual([
        { key: "props", sectionTokens: ["xAlign", "0.2"] },
        { key: "movein", sectionTokens: [] },
    ]);
});

test("extractKeyedSections: a repeated key produces one section per occurrence", () => {
    const tokens = ["props", "x", "1", "props", "y", "2"];
    expect(InkCompiler.extractKeyedSections(tokens, ["props"])).toEqual([
        { key: "props", sectionTokens: ["x", "1"] },
        { key: "props", sectionTokens: ["y", "2"] },
    ]);
});

// ── validateKeyedJsonSchemas ────────────────────────────────────────────────────

const PROPS_SCHEMA = {
    type: "object",
    properties: { xAlign: { type: "number" }, yAlign: { type: "number" } },
    additionalProperties: false,
};
const MOVEIN_SCHEMA = {
    type: "object",
    properties: {
        direction: { type: "string", enum: ["left", "right", "top", "bottom"] },
        ease: { type: "string" },
    },
    additionalProperties: false,
};
const KEY_SCHEMAS = { props: PROPS_SCHEMA, movein: MOVEIN_SCHEMA };

test("validateKeyedJsonSchemas returns no issues when every keyed section matches its schema", () => {
    const tokens = [
        "show",
        "imagecontainer",
        "sly",
        "props",
        "xAlign",
        "0.2",
        "yAlign",
        "1",
        "movein",
        "direction",
        "right",
        "ease",
        "anticipate",
    ];
    expect(InkCompiler.validateKeyedJsonSchemas(tokens, KEY_SCHEMAS)).toEqual([]);
});

test("validateKeyedJsonSchemas reports an unrecognised property inside a keyed section", () => {
    // "xAlin" is a typo of "xAlign"
    const tokens = ["props", "xAlin", "0.2", "yAlign", "1"];
    const issues = InkCompiler.validateKeyedJsonSchemas(tokens, KEY_SCHEMAS);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ key: "props", element: "xAlin" });
});

test("validateKeyedJsonSchemas reports a type mismatch inside a keyed section", () => {
    const tokens = ["props", "xAlign", "not-a-number"];
    const issues = InkCompiler.validateKeyedJsonSchemas(tokens, KEY_SCHEMAS);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ key: "props", element: "xAlign" });
    expect(issues[0].message).toContain("number");
});

test("validateKeyedJsonSchemas reports each mismatching section independently", () => {
    const tokens = [
        "props",
        "xAlign",
        "not-a-number",
        "movein",
        "direction",
        "diagonally",
        "ease",
        "anticipate",
    ];
    const issues = InkCompiler.validateKeyedJsonSchemas(tokens, KEY_SCHEMAS);
    expect(issues.map((issue) => issue.key).sort()).toEqual(["movein", "props"]);
});

test("validateKeyedJsonSchemas reports (rather than throws on) a section with an odd number of tokens", () => {
    const tokens = ["props", "xAlign"];
    const issues = InkCompiler.validateKeyedJsonSchemas(tokens, KEY_SCHEMAS);
    expect(issues).toHaveLength(1);
    expect(issues[0].key).toBe("props");
});

test("validateKeyedJsonSchemas returns no issues when none of the configured keys occur", () => {
    expect(InkCompiler.validateKeyedJsonSchemas(["show", "image", "bg"], KEY_SCHEMAS)).toEqual([]);
});

test("validateKeyedJsonSchemas validates the whole tail against a single schema (the 'wait' example)", () => {
    // `convertListStringToObj` auto-coerces numeric-looking tokens (e.g. "3" -> 3), so `hours` is
    // typed as a number here; `days` is a non-numeric string ("tomorrow") to stay a string.
    const waitSchema = {
        type: "object",
        properties: { hours: { type: "number" }, days: { type: "string" } },
        additionalProperties: false,
    };
    const validTokens = ["wait", "hours", "3", "days", "tomorrow"];
    expect(InkCompiler.validateKeyedJsonSchemas(validTokens, { wait: waitSchema })).toEqual([]);

    const invalidTokens = ["wait", "hours", "3", "weeks", "1"];
    const issues = InkCompiler.validateKeyedJsonSchemas(invalidTokens, { wait: waitSchema });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ key: "wait", element: "weeks" });
});

// ── getHashtagKeySchemaIssues ────────────────────────────────────────────────────

const showImagecontainerCommand: InkHashtagCommandInfo = {
    name: "show imagecontainer",
    validation: { type: "regexp", source: "^show imagecontainer\\b", flags: "" },
    keySchemas: KEY_SCHEMAS,
};

test("getHashtagKeySchemaIssues locates the line and raw command for a keyed-section mismatch", () => {
    const source = [
        "=== start ===",
        '# show imagecontainer sly [ "a.png" ] props xAlin 0.2 yAlign 1',
        "Hello world!",
    ].join("\n");

    const issues = InkCompiler.getHashtagKeySchemaIssues(source, [showImagecontainerCommand]);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ line: 2, key: "props", element: "xAlin" });
    expect(issues[0].command).toBe('show imagecontainer sly [ "a.png" ] props xAlin 0.2 yAlign 1');
});

test("getHashtagKeySchemaIssues skips a command that doesn't match any registered validation", () => {
    const source = "=== start ===\n# totally unknown command props xAlin 0.2\n";
    const issues = InkCompiler.getHashtagKeySchemaIssues(source, [showImagecontainerCommand]);
    expect(issues).toEqual([]);
});

test("getHashtagKeySchemaIssues skips a matching command with no keySchemas configured", () => {
    const source = "=== start ===\n# show imagecontainer sly [ \"a.png\" ] props xAlin 0.2\n";
    const commandWithoutKeySchemas: InkHashtagCommandInfo = {
        name: "show imagecontainer",
        validation: { type: "regexp", source: "^show imagecontainer\\b", flags: "" },
    };
    const issues = InkCompiler.getHashtagKeySchemaIssues(source, [commandWithoutKeySchemas]);
    expect(issues).toEqual([]);
});

test("getHashtagKeySchemaIssues returns no issues for a fully valid keyed command", () => {
    const source =
        '=== start ===\n# show imagecontainer sly [ "a.png" ] props xAlign 0.2 yAlign 1 movein direction right ease anticipate\n';
    const issues = InkCompiler.getHashtagKeySchemaIssues(source, [showImagecontainerCommand]);
    expect(issues).toEqual([]);
});

test("getHashtagKeySchemaIssues reports one issue per malformed section on the same line", () => {
    const source =
        "=== start ===\n# show imagecontainer sly [ \"a.png\" ] props xAlin 0.2 movein direction diagonally\n";
    const issues = InkCompiler.getHashtagKeySchemaIssues(source, [showImagecontainerCommand]);
    expect(issues).toHaveLength(2);
    expect(issues.every((issue) => issue.line === 2)).toBe(true);
    expect(issues.map((issue) => issue.key).sort()).toEqual(["movein", "props"]);
});

// ── end-to-end: HashtagCommands.add({ keySchemas }) → HashtagCommands.info() → InkCompiler ─────

test("end-to-end: a keySchemas mismatch on a custom .add() command is caught via HashtagCommands.info()", () => {
    HashtagCommands.clear();
    HashtagCommands.add(
        () => true,
        {
            name: "wait-with-options",
            validation: /^wait\b/,
            keySchemas: {
                wait: {
                    type: "object",
                    properties: { hours: { type: "number" }, days: { type: "string" } },
                    additionalProperties: false,
                },
            },
        },
    );

    try {
        const commands: InkHashtagCommandInfo[] = HashtagCommands.info().map(
            ({ name, description, validation, keySchemas }) => ({
                name,
                description,
                validation:
                    validation instanceof RegExp
                        ? { type: "regexp" as const, source: validation.source, flags: validation.flags }
                        : { type: "literal" as const, value: String(validation) },
                keySchemas,
            }),
        );

        const validSource = "=== start ===\n# wait hours 3 days tomorrow\n";
        expect(InkCompiler.getHashtagKeySchemaIssues(validSource, commands)).toEqual([]);

        const invalidSource = '=== start ===\n# wait hours 3 weeks 1\n';
        const issues = InkCompiler.getHashtagKeySchemaIssues(invalidSource, commands);
        expect(issues).toHaveLength(1);
        expect(issues[0]).toMatchObject({ key: "wait", element: "weeks", line: 2 });
    } finally {
        HashtagCommands.clear();
    }
});
