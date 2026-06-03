import { RegisteredCharacters, RegisteredLabels } from "@drincs/pixi-vn";
import { setupInkHmrListener } from "@drincs/pixi-vn-ink/vite-listener";

await Promise.all([import("./content")]);
const pixivnViteListener = await import("@drincs/pixi-vn/vite-listener").catch(
    () => undefined,
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
