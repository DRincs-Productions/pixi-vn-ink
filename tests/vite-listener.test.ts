import { handleInkUpdatedPayload } from "@/vite-listener/plugins";
import type { PixiVNJson } from "@drincs/pixi-vn-json";
import { describe, expect, it, vi } from "vitest";

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
});
