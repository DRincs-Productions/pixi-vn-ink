import { RegisteredCharacters, RegisteredLabels } from "@drincs/pixi-vn";
import { setupInkHmrListener } from "@drincs/pixi-vn-ink/vite-listener";
import { setupPixivnViteData } from "@drincs/pixi-vn/vite-listener";
import inkTexts from "virtual:pixi-vn-ink";

RegisteredCharacters.add({
    id: "alice",
});

setupPixivnViteData();
setupInkHmrListener();

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
    throw new Error("#app not found");
}

app.innerHTML = `
  <h1>Vite Plugin Ink Test</h1>
    <p>Ink files found: <strong>${inkTexts.length}</strong></p>
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
