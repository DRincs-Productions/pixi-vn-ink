import { InkCompiler } from "@/parser";
import type { InkHashtagCommandInfo } from "@/parser/types";
import { expect, test } from "vitest";
import { z } from "zod";

const showImageCommand: InkHashtagCommandInfo = {
    name: "Show image",
    validation: {
        type: "zod",
        schema: z.toJSONSchema(
            z.tuple([z.literal("show"), z.literal("image"), z.string()]).rest(z.string()),
        ) as Record<string, unknown>,
    },
};

const jumpCommand: InkHashtagCommandInfo = {
    name: "Jump",
    validation: {
        type: "zod",
        schema: z.toJSONSchema(z.tuple([z.literal("jump"), z.string()])) as Record<string, unknown>,
    },
};

const pauseVideoCommand: InkHashtagCommandInfo = {
    name: "Pause/Resume video",
    validation: {
        type: "zod",
        schema: z.toJSONSchema(
            z.tuple([z.enum(["pause", "resume"]), z.literal("video"), z.string()]),
        ) as Record<string, unknown>,
    },
};

const loadAssetsOrBundleCommand: InkHashtagCommandInfo = {
    name: "Load assets/bundle",
    validation: {
        type: "zod",
        schema: z.toJSONSchema(
            z.union([
                z.tuple([z.enum(["load", "lazyload"]), z.literal("assets")]).rest(z.string()),
                z.tuple([z.enum(["load", "lazyload"]), z.literal("bundle")]).rest(z.string()),
            ]),
        ) as Record<string, unknown>,
    },
};

// ── typo'd literal/enum tokens are reported against the closest registered command ──────────────

test("reports a typo'd leading literal as a likely match for the closest command", () => {
    const source = "=== start ===\n# shwo image bg\n";
    const issues = InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues(source, [showImageCommand]);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
        line: 2,
        command: "shwo image bg",
        handlerName: "Show image",
        element: "shwo",
        message: 'must be "show"',
    });
    expect(issues[0].score).toBeGreaterThanOrEqual(0.8);
});

test("reports a typo'd enum token (mid-command, not just the leading literal)", () => {
    const source = "=== start ===\n# show imag bg\n";
    const issues = InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues(source, [showImageCommand]);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ line: 2, element: "imag", message: 'must be "image"' });
});

test("reports a typo'd enum-of-values token with every allowed value in the message", () => {
    const source = "=== start ===\n# pasue video bg\n";
    const issues = InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues(source, [pauseVideoCommand]);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ element: "pasue", handlerName: "Pause/Resume video" });
    expect(issues[0].message).toContain('"pause"');
    expect(issues[0].message).toContain('"resume"');
});

test("picks the closest matching branch of a union ('zod' schema serialized from z.union)", () => {
    // Second token is a typo of "bundle", not "assets" — only the "bundle" branch should be reported.
    const source = "=== start ===\n# load bundel hero\n";
    const issues = InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues(source, [
        loadAssetsOrBundleCommand,
    ]);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ element: "bundel", message: 'must be "bundle"' });
});

// ── length mismatches (missing/extra tokens on a fixed-arity command) ───────────────────────────

test("reports a missing required argument via Ajv's own minItems error", () => {
    const source = "=== start ===\n# jump\n";
    const issues = InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues(source, [jumpCommand]);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ handlerName: "Jump" });
    expect(issues[0].message).toMatch(/items/i);
});

test("reports an unexpected extra argument via Ajv's own maxItems error", () => {
    const source = "=== start ===\n# jump knot_a knot_b\n";
    const issues = InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues(source, [jumpCommand]);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ handlerName: "Jump" });
    expect(issues[0].message).toMatch(/items/i);
});

test("a trailing token is not penalized when the command's schema allows it (.rest())", () => {
    // Even with a typo'd second literal, "show image bg some extra free-form text" shouldn't be
    // penalized for its trailing tokens — "Show image" allows any number of them.
    const source = "=== start ===\n# show imga bg some extra free-form text\n";
    const issues = InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues(source, [showImageCommand]);

    expect(issues).toHaveLength(1);
    expect(issues[0].element).toBe("imga");
});

// ── nothing is reported when there's no good candidate ──────────────────────────────────────────

test("reports nothing for a command that already matches a registered handler", () => {
    const source = "=== start ===\n# show image bg\n";
    const issues = InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues(source, [showImageCommand]);
    expect(issues).toEqual([]);
});

test("reports nothing for a genuinely unrelated/custom command (score too low)", () => {
    const source = "=== start ===\n# enter_room mc_room\n";
    const issues = InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues(source, [
        showImageCommand,
        jumpCommand,
        pauseVideoCommand,
    ]);
    expect(issues).toEqual([]);
});

test("reports nothing when no registered command has a 'zod' validation", () => {
    const regexCommand: InkHashtagCommandInfo = {
        name: "Custom",
        validation: { type: "regexp", source: "^custom\\b", flags: "" },
    };
    const source = "=== start ===\n# custmo foo\n";
    expect(InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues(source, [regexCommand])).toEqual([]);
});

test("ignores a 'zod' schema with no const/enum discriminant position (nothing to typo-match against)", () => {
    const freeFormCommand: InkHashtagCommandInfo = {
        name: "Free-form",
        validation: {
            type: "zod",
            schema: z.toJSONSchema(z.tuple([z.string(), z.string()])) as Record<string, unknown>,
        },
    };
    const source = "=== start ===\n# anything at all\n";
    expect(
        InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues(source, [freeFormCommand]),
    ).toEqual([]);
});

// ── multiple occurrences ─────────────────────────────────────────────────────────────────────────

test("reports one issue per offending line, each with its own 1-based line number", () => {
    const source = ["=== start ===", "# shwo image bg", "Hello!", "# jum knot_a"].join("\n");
    const issues = InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues(source, [
        showImageCommand,
        jumpCommand,
    ]);

    expect(issues.map((issue) => issue.line).sort()).toEqual([2, 4]);
});
