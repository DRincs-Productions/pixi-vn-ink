import { InkCompiler } from "@/parser";
import { expect, test } from "vitest";

// ── getSchemaValidator ────────────────────────────────────────────────────────

test("getSchemaValidator compiles a schema into a reusable Ajv validator", () => {
    const validate = InkCompiler.getSchemaValidator({
        type: "object",
        properties: { x: { type: "number" } },
    });
    expect(validate({ x: 1 })).toBe(true);
    expect(validate({ x: "1" })).toBe(false);
});

// ── validateAgainstJsonSchema: happy path ─────────────────────────────────────

test("validateAgainstJsonSchema returns an empty array when the document is valid", () => {
    const schema = { type: "object", properties: { x: { type: "number" } } };
    expect(InkCompiler.validateAgainstJsonSchema({ x: 1 }, schema)).toEqual([]);
});

test("validateAgainstJsonSchema accepts an already-compiled validator instead of a raw schema", () => {
    const validate = InkCompiler.getSchemaValidator({
        type: "object",
        properties: { x: { type: "number" } },
        required: ["x"],
    });
    expect(InkCompiler.validateAgainstJsonSchema({ x: 1 }, validate)).toEqual([]);
    expect(InkCompiler.validateAgainstJsonSchema({}, validate)).toHaveLength(1);
});

// ── validateAgainstJsonSchema: the invalid element ────────────────────────────

test("validateAgainstJsonSchema reports the invalid field as `element` for a type mismatch", () => {
    // "x" was assigned a string but the schema only accepts a number.
    const schema = { type: "object", properties: { x: { type: "number" } } };
    const issues = InkCompiler.validateAgainstJsonSchema({ x: "not a number" }, schema);
    expect(issues).toHaveLength(1);
    expect(issues[0].element).toBe("x");
    expect(issues[0].instancePath).toBe("/x");
    expect(issues[0].message).toContain("number");
});

test("validateAgainstJsonSchema reports the missing property name as `element` for a required error", () => {
    const schema = {
        type: "object",
        properties: { x: { type: "number" } },
        required: ["x"],
    };
    const issues = InkCompiler.validateAgainstJsonSchema({}, schema);
    expect(issues).toHaveLength(1);
    expect(issues[0].element).toBe("x");
    expect(issues[0].message).toContain("required");
});

test("validateAgainstJsonSchema falls back to \"(root)\" for a whole-document mismatch", () => {
    const issues = InkCompiler.validateAgainstJsonSchema("not an object", { type: "object" });
    expect(issues).toHaveLength(1);
    expect(issues[0].element).toBe("(root)");
    expect(issues[0].instancePath).toBe("(root)");
});

// ── validateAgainstJsonSchema: $origin tracing ────────────────────────────────

test("validateAgainstJsonSchema resolves the nearest $origin for a nested invalid value", () => {
    const schema = {
        type: "object",
        properties: {
            labels: {
                type: "object",
                additionalProperties: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            operations: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: { aliases: { type: "string" } },
                                },
                            },
                        },
                    },
                },
            },
        },
    };
    const data = {
        labels: {
            start: [
                {
                    operations: [{ $origin: "lazyload assets myAlias", aliases: ["myAlias"] }],
                },
            ],
        },
    };
    const issues = InkCompiler.validateAgainstJsonSchema(data, schema);
    expect(issues).toHaveLength(1);
    expect(issues[0].element).toBe("aliases");
    expect(issues[0].origin).toBe("lazyload assets myAlias");
});

test("validateAgainstJsonSchema leaves `origin` undefined when no ancestor carries $origin", () => {
    const schema = { type: "object", properties: { x: { type: "number" } } };
    const issues = InkCompiler.validateAgainstJsonSchema({ x: "not a number" }, schema);
    expect(issues[0].origin).toBeUndefined();
});

// ── validateAgainstJsonSchema: anyOf/oneOf fan-out collapsing ─────────────────

test("validateAgainstJsonSchema collapses a widely-fanned-out anyOf failure into one specific issue", () => {
    // Mirrors a real operation type being one of many in a wide union: every rejected branch
    // requires a distinct, irrelevant field, except one with a genuinely specific mismatch.
    const schema = {
        type: "object",
        properties: {
            operations: {
                type: "array",
                items: {
                    anyOf: [
                        { type: "object", required: ["notAField1"] },
                        { type: "object", required: ["notAField2"] },
                        {
                            type: "object",
                            properties: { aliases: { type: "string" } },
                            required: ["aliases"],
                        },
                    ],
                },
            },
        },
    };
    const data = { operations: [{ aliases: ["myAlias"] }] };
    const issues = InkCompiler.validateAgainstJsonSchema(data, schema);

    expect(issues).toHaveLength(1);
    expect(issues[0].element).toBe("aliases");
    expect(issues.some((issue) => issue.message.includes("notAField"))).toBe(false);
    expect(issues.some((issue) => issue.message.includes("anyOf"))).toBe(false);
});

test("validateAgainstJsonSchema deduplicates repeated complaints about the same field", () => {
    const schema = {
        type: "object",
        properties: {
            operations: {
                type: "array",
                items: {
                    anyOf: [
                        { type: "object", properties: { x: { type: "number" } } },
                        { type: "object", properties: { x: { type: "number" } } },
                    ],
                    required: ["x"],
                },
            },
        },
    };
    const data = { operations: [{ x: "not a number" }] };
    const issues = InkCompiler.validateAgainstJsonSchema(data, schema);
    expect(issues.filter((issue) => issue.element === "x")).toHaveLength(1);
});

// ── validateAgainstJsonSchema: discriminated-union operation narrowing ────────

/**
 * A schema shaped like a small slice of the real `PixiVNJsonOperation` union: several
 * `definitions` discriminated by `type`(+`operationType`), each with a `props` object that
 * rejects unknown keys. Regression coverage for a real bug: a typo'd prop key (e.g. `xAlin`
 * instead of `xAlign`) used to report one warning *per rejected union branch* (5+ for a single
 * typo), none of which named the actual offending key.
 */
const OPERATION_UNION_SCHEMA = {
    type: "object",
    properties: {
        operations: {
            type: "array",
            items: { anyOf: [{ $ref: "#/definitions/ShowImage" }, { $ref: "#/definitions/ShowImageContainer" }] },
        },
    },
    definitions: {
        ShowImage: {
            type: "object",
            properties: {
                type: { const: "image" },
                operationType: { const: "show" },
                alias: { type: "string" },
                props: {
                    type: "object",
                    properties: { x: { type: "number" }, y: { type: "number" } },
                    additionalProperties: false,
                },
            },
            required: ["type", "operationType", "alias"],
        },
        ShowImageContainer: {
            type: "object",
            properties: {
                type: { const: "imagecontainer" },
                operationType: { const: "show" },
                alias: { type: "string" },
                props: {
                    type: "object",
                    properties: { xAlign: { type: "number" }, yAlign: { type: "number" } },
                    additionalProperties: false,
                },
            },
            required: ["type", "operationType", "alias"],
        },
    },
};

test("validateAgainstJsonSchema narrows a typo'd prop key on a discriminated-union operation to one issue naming the key", () => {
    const data = {
        operations: [
            {
                type: "imagecontainer",
                operationType: "show",
                alias: "james",
                props: { xAlin: 0.5, yAlign: 1 },
                $origin: "show imagecontainer james [...] xAlin 0.5 yAlign 1",
            },
        ],
    };
    const issues = InkCompiler.validateAgainstJsonSchema(data, OPERATION_UNION_SCHEMA);

    expect(issues).toHaveLength(1);
    expect(issues[0].element).toBe("xAlin");
    expect(issues[0].message).toContain('"xAlin"');
    expect(issues[0].message).toContain('did you mean "xAlign"');
    expect(issues[0].origin).toBe("show imagecontainer james [...] xAlin 0.5 yAlign 1");
});

test("validateAgainstJsonSchema returns no issues for a valid discriminated-union operation", () => {
    const data = {
        operations: [
            { type: "imagecontainer", operationType: "show", alias: "james", props: { xAlign: 0.5 } },
        ],
    };
    expect(InkCompiler.validateAgainstJsonSchema(data, OPERATION_UNION_SCHEMA)).toEqual([]);
});

test("validateAgainstJsonSchema falls back to the original fan-out report for an unrecognised operation type", () => {
    // "type" doesn't match any definition's discriminant at all, so narrowing can't identify a
    // single intended branch — this must still report *something* instead of silently dropping
    // the error or throwing.
    const data = {
        operations: [{ type: "totally-unknown", operationType: "show", alias: "james" }],
    };
    const issues = InkCompiler.validateAgainstJsonSchema(data, OPERATION_UNION_SCHEMA);
    expect(issues.length).toBeGreaterThan(0);
});
