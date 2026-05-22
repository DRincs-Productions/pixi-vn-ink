import { handleInkUpdatedPayload } from "@/vite-listener/plugins";
import { describe, expect, it, vi } from "vitest";

describe("vite-listener HMR payload handling", () => {
    it("imports JSON when payload only contains inkJsonManifest", async () => {
        const importJsonFromManifest = vi.fn(async () => true);
        const importInkText = vi.fn(async () => {});

        await handleInkUpdatedPayload(
            {
                inkJsonManifest: ["/ink-json/start.json"],
            },
            undefined,
            {
                importJsonFromManifest,
                importInkText,
            },
        );

        expect(importJsonFromManifest).toHaveBeenCalledWith(["/ink-json/start.json"]);
        expect(importInkText).not.toHaveBeenCalled();
    });
});
