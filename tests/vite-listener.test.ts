import { importInkText, importJson } from "@/loader/importer";
import { handleInkUpdatedPayload, setupInkHmrListener } from "@/vite-listener/plugins";
import type { PixiVNJson } from "@drincs/pixi-vn-json";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/loader/importer", () => ({
    importInkText: vi.fn(async () => []),
    importJson: vi.fn(async () => {}),
}));

vi.mock("virtual:pixi-vn-ink", () => ({ inkJsons: [{ inkVersion: 21 }], default: [] }));

describe("vite-listener HMR payload handling", () => {
    it("imports JSON directly when payload contains inkJson", async () => {
        const mockJson = [{ inkVersion: 21 }] as unknown as PixiVNJson[];
        const importJson = vi.fn(async () => {});
        const importInkText = vi.fn(async () => {});

        await handleInkUpdatedPayload({ inkJson: mockJson }, { importJson, importInkText });

        expect(importJson).toHaveBeenCalledWith(mockJson);
        expect(importInkText).not.toHaveBeenCalled();
    });

    it("falls back to importInkText when payload has no inkJson", async () => {
        const importJson = vi.fn(async () => {});
        const importInkText = vi.fn(async () => {});

        await handleInkUpdatedPayload(
            { inkText: "=== start ===\nHello!\n" },
            { importJson, importInkText },
        );

        expect(importInkText).toHaveBeenCalledWith("=== start ===\nHello!\n");
        expect(importJson).not.toHaveBeenCalled();
    });

    it("handles string payload as inkText", async () => {
        const importJson = vi.fn(async () => {});
        const importInkText = vi.fn(async () => {});

        await handleInkUpdatedPayload("=== start ===\nHello!\n", { importJson, importInkText });

        expect(importInkText).toHaveBeenCalledWith("=== start ===\nHello!\n");
        expect(importJson).not.toHaveBeenCalled();
    });

    // Regression for #123: the raw-inkText HMR fallback forwards the `characters` option to importInkText.
    it("forwards the characters option to the default importInkText for raw inkText", async () => {
        const importInkTextMock = vi.mocked(importInkText);
        importInkTextMock.mockClear();
        const characters = [{ id: "bob" }];

        await handleInkUpdatedPayload("=== start ===\nbob: Hi\n", undefined, { characters });

        expect(importInkTextMock).toHaveBeenCalledWith("=== start ===\nbob: Hi\n", { characters });
    });
});

describe("setupInkHmrListener", () => {
    it("imports the initial ink JSON even without import.meta.hot (production build / preview)", async () => {
        // Regression test: `import.meta.hot` is only defined while a Vite dev server is
        // attached — it's `undefined` in a production build and in `vite preview`. The initial
        // `importJson(inkJsons)` call must not be gated behind it, otherwise a deployed build
        // never loads any ink-derived content (labels, steps, ...) into the game engine at all,
        // since nothing else in a typical app calls `importJson` for these files.
        const importJsonMock = vi.mocked(importJson);
        importJsonMock.mockClear();

        await setupInkHmrListener();

        expect(importJsonMock).toHaveBeenCalledWith([{ inkVersion: 21 }]);
    });
});
