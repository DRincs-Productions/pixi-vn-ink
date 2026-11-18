import { convertInkToJson, convertJsonToInk } from "@/converter";
import type { PixiVNJson } from "@drincs/pixi-vn-json";
import { expect } from "vitest";

/** Converts PixiVN JSON to Ink and back, then deeply compares the result with the input. */
export function expectJsonInkRoundTrip(input?: PixiVNJson): void {
    if (!input) {
        return;
    }
    const ink = convertJsonToInk(input);
    const output = convertInkToJson(ink);

    expect(output).toEqual(input);
}
