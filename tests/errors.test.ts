import { convertInkText } from "@/loader";
import { InkCompiler } from "@drincs/pixi-vn-ink/parser";
import { expect, test } from "vitest";

/**
 * An empty bare divert `->` outside a choice is an ink compile error.
 */
test("Label test 1", async () => {
    const res = convertInkText(`
=== back_in_london ===

We arrived into London at 9.45pm exactly.
-> hurry_home

=== hurry_home ===
We hurried home to Savile Row as fast as we could.
	->
`);
    expect(res).toEqual(undefined);
});

/**
 * InkCompiler.compile returns issue objects describing errors when ink syntax is invalid.
 * An empty bare divert `->` (not in a choice) generates an error and json is undefined.
 */
test("InkCompiler compile returns error issues for invalid syntax", async () => {
    const { json, issues } = InkCompiler.compile(`
=== start ===
Hello!
    ->
`);
    expect(json).toBeUndefined();
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toBe("Empty diverts (->) are only valid on choices");
    expect(issues[0].type).toBe(2);
    expect(issues[0].line).toBe(4);
});

/**
 * InkCompiler.compile auto-handles a variable assignment without a matching VAR declaration
 * by recording the variable name in shared.initialVarsToRemove so it can be declared
 * on a subsequent compilation pass.
 */
test("InkCompiler compile auto-handles undeclared variable", async () => {
    const shared = {
        labelToRemove: [] as string[],
        initialVarsToRemove: [] as string[],
        functions: [] as { name: string; args: string[] }[],
        enums: {} as Record<string, number[]>,
        textSource: `
=== start ===
~ my_var = 42
Hello {my_var}!
-> DONE
`,
    };
    const { json, issues } = InkCompiler.compile(shared.textSource, shared);
    // After auto-fix the compilation succeeds
    expect(json).toBeDefined();
    expect(issues).toHaveLength(0);
    // The variable was recorded so a VAR declaration can be injected on next pass
    expect(shared.initialVarsToRemove).toContain("my_var");
});

/**
 * InkCompiler.compile auto-handles a divert target that doesn't exist as a knot
 * by recording the missing label name in shared.labelToRemove so an empty knot
 * can be injected on a subsequent compilation pass.
 */
test("InkCompiler compile auto-handles missing divert target", async () => {
    const shared = {
        labelToRemove: [] as string[],
        initialVarsToRemove: [] as string[],
        functions: [] as { name: string; args: string[] }[],
        enums: {} as Record<string, number[]>,
        textSource: `
=== start ===
Hello!
-> nonexistent_label
`,
    };
    const { json, issues } = InkCompiler.compile(shared.textSource, shared);
    // After auto-fix the compilation succeeds
    expect(json).toBeDefined();
    expect(issues).toHaveLength(0);
    // The missing label was recorded so an empty knot can be injected on the next pass
    expect(shared.labelToRemove).toContain("nonexistent_label");
});
