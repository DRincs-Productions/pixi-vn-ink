import { convertInkToJson, convertJsonToInk, type LoaderSharedType } from "@/converter";
import type { PixiVNJson } from "@drincs/pixi-vn-json";
import { expect } from "vitest";

/** Converts PixiVN JSON to Ink and back, then deeply compares the result with the input. */
export function expectJsonInkRoundTrip(
    input?: PixiVNJson,
    options?: Partial<LoaderSharedType>,
): void {
    if (!input) {
        throw new Error("Expected PixiVN JSON for round-trip");
    }
    const ink = convertJsonToInk(input);
    const output = convertInkToJson(ink, options);

    expect(output).toEqual(input);
}
