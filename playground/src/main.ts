import { RegisteredCharacters, RegisteredLabels } from "@drincs/pixi-vn";
import { setupInkHmrListener } from "@drincs/pixi-vn-ink/vite-listener";

await Promise.all([import("./content")]);
const pixivnViteListener = await import("@drincs/pixi-vn/vite-listener").catch(
    (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        const code =
            typeof error === "object" && error !== null && "code" in error
                ? String((error as { code?: unknown }).code)
                : "";
        if (
            code === "ERR_MODULE_NOT_FOUND" ||
            code === "ERR_PACKAGE_PATH_NOT_EXPORTED" ||
            message.includes("@drincs/pixi-vn/vite-listener")
        ) {
            return undefined;
        }
        throw error;
    },
);
if (pixivnViteListener?.setupPixivnViteData) {
    await pixivnViteListener.setupPixivnViteData();
}
await setupInkHmrListener();

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
    throw new Error("#app not found");
}

app.innerHTML = `
  <h1>Vite Plugin Ink Test</h1>
    <p>Also check <code>public/ink-json</code> and <code>src/assets/ink-manifest.gen.json</code>.</p>
    <p>Labels registered in Pixi’VN engine:</p>
    <ul>
        ${RegisteredLabels.values()
            .map((label) => `<li><code>${label.id}</code></li>`)
            .join("")}
    </ul>
    <p>Characters registered in Pixi’VN engine:</p>
    <ul>
        ${RegisteredCharacters.values()
            .map((char) => `<li><code>${char.id}</code></li>`)
            .join("")}
    </ul>
`;
