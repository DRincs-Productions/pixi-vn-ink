import { InkCompiler } from "@/parser";
import { expect, test } from "vitest";

// ── empty / guard cases ───────────────────────────────────────────────────────

test("getUnknownDivertTargets: returns empty array for empty source", () => {
    expect(InkCompiler.getUnknownDivertTargets("", ["someLabel"])).toEqual([]);
});

test("getUnknownDivertTargets: reports unknown targets even when knownLabels is empty", () => {
    const source = "=== start ===\n-> unknownLabel\n";
    const result = InkCompiler.getUnknownDivertTargets(source, []);
    expect(result).toHaveLength(1);
    expect(result[0].target).toBe("unknownLabel");
});

// ── built-in ink targets ──────────────────────────────────────────────────────

test("getUnknownDivertTargets: DONE is never reported", () => {
    const source = "=== start ===\n-> DONE\n";
    expect(InkCompiler.getUnknownDivertTargets(source, ["someLabel"])).toEqual([]);
});

test("getUnknownDivertTargets: END is never reported", () => {
    const source = "=== start ===\n-> END\n";
    expect(InkCompiler.getUnknownDivertTargets(source, ["someLabel"])).toEqual([]);
});

// ── locally-defined labels ────────────────────────────────────────────────────

test("getUnknownDivertTargets: divert to a locally-defined knot is not reported", () => {
    const source = "=== start ===\n-> middle\n\n=== middle ===\nHello\n-> DONE\n";
    expect(InkCompiler.getUnknownDivertTargets(source, ["otherLabel"])).toEqual([]);
});

test("getUnknownDivertTargets: divert to a locally-defined stitch is not reported", () => {
    const source = "=== start ===\n= intro\nHello\n-> intro\n-> DONE\n";
    expect(InkCompiler.getUnknownDivertTargets(source, ["otherLabel"])).toEqual([]);
});

test("getUnknownDivertTargets: divert to a locally-defined function knot is not reported", () => {
    const source = "=== start ===\n~ myFunc()\n-> DONE\n\n=== function myFunc() ===\n~ return\n";
    expect(InkCompiler.getUnknownDivertTargets(source, ["otherLabel"])).toEqual([]);
});

// ── known external labels ─────────────────────────────────────────────────────

test("getUnknownDivertTargets: divert to a label present in knownLabels is not reported", () => {
    const source = "=== start ===\n-> externalScene\n-> DONE\n";
    expect(InkCompiler.getUnknownDivertTargets(source, ["externalScene"])).toEqual([]);
});

test("getUnknownDivertTargets: dot-notation target resolved via top-level knownLabel", () => {
    // -> myKnot.myStitch: if "myKnot" is a known label the divert is considered valid.
    const source = "=== start ===\n-> myKnot.myStitch\n-> DONE\n";
    expect(InkCompiler.getUnknownDivertTargets(source, ["myKnot"])).toEqual([]);
});

test("getUnknownDivertTargets: dot-notation target resolved via pixi-vn separator in knownLabels", () => {
    // -> myKnot.myStitch maps to "myKnot_|_myStitch" in pixi-vn JSON label keys.
    const source = "=== start ===\n-> myKnot.myStitch\n-> DONE\n";
    expect(InkCompiler.getUnknownDivertTargets(source, ["myKnot_|_myStitch"])).toEqual([]);
});

// ── unknown targets ───────────────────────────────────────────────────────────

test("getUnknownDivertTargets: unknown target is reported with correct line", () => {
    const source = "=== start ===\n-> ghostLabel\n-> DONE\n";
    const result = InkCompiler.getUnknownDivertTargets(source, ["otherLabel"]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ line: 2, target: "ghostLabel" });
});

test("getUnknownDivertTargets: each distinct unknown target reported only once", () => {
    const source = "=== start ===\n-> ghost\n-> ghost\n-> DONE\n";
    const result = InkCompiler.getUnknownDivertTargets(source, ["otherLabel"]);
    expect(result).toHaveLength(1);
    expect(result[0].target).toBe("ghost");
});

test("getUnknownDivertTargets: multiple distinct unknown targets each reported once", () => {
    const source = "=== start ===\n-> alpha\n-> beta\n-> DONE\n";
    const result = InkCompiler.getUnknownDivertTargets(source, ["otherLabel"]);
    expect(result).toHaveLength(2);
    const targets = result.map((r) => r.target);
    expect(targets).toContain("alpha");
    expect(targets).toContain("beta");
});

test("getUnknownDivertTargets: correct line numbers for targets on different lines", () => {
    const source = "=== start ===\n-> alpha\nSome text\n-> beta\n-> DONE\n";
    const result = InkCompiler.getUnknownDivertTargets(source, []);
    const byTarget = Object.fromEntries(result.map((r) => [r.target, r.line]));
    expect(byTarget.alpha).toBe(2);
    expect(byTarget.beta).toBe(4);
});

// ── comment stripping ─────────────────────────────────────────────────────────

test("getUnknownDivertTargets: target in a line comment is not reported", () => {
    const source = "=== start ===\n// -> ghostLabel\n-> DONE\n";
    expect(InkCompiler.getUnknownDivertTargets(source, ["otherLabel"])).toEqual([]);
});

test("getUnknownDivertTargets: target after inline comment marker is not reported", () => {
    const source = "=== start ===\nSome text // -> ghostLabel\n-> DONE\n";
    expect(InkCompiler.getUnknownDivertTargets(source, ["otherLabel"])).toEqual([]);
});

// ── whitespace variants ───────────────────────────────────────────────────────

test("getUnknownDivertTargets: divert with tab after arrow is detected", () => {
    const source = "=== start ===\n->\tghostLabel\n-> DONE\n";
    const result = InkCompiler.getUnknownDivertTargets(source, ["otherLabel"]);
    expect(result).toHaveLength(1);
    expect(result[0].target).toBe("ghostLabel");
});

test("getUnknownDivertTargets: handles Windows (CRLF) line endings", () => {
    const source = "=== start ===\r\n-> ghostLabel\r\n-> DONE\r\n";
    const result = InkCompiler.getUnknownDivertTargets(source, ["otherLabel"]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ line: 2, target: "ghostLabel" });
});

// ── mixed: local + external + unknown ────────────────────────────────────────

test("getUnknownDivertTargets: only truly unknown targets are reported", () => {
    const source = [
        "=== start ===",
        "-> localKnot",   // local → ok
        "-> externalA",   // known external → ok
        "-> missingOne",  // unknown → reported
        "-> DONE",        // built-in → ok
        "",
        "=== localKnot ===",
        "Text",
        "-> DONE",
    ].join("\n");

    const result = InkCompiler.getUnknownDivertTargets(source, ["externalA"]);
    expect(result).toHaveLength(1);
    expect(result[0].target).toBe("missingOne");
});
