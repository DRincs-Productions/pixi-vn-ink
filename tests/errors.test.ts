import { convertInkText } from "@/loader";
import { expect, test } from "vitest";

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
