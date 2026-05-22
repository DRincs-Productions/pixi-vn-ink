import { setupInkHmrListener } from "@drincs/pixi-vn-ink/vite-listener";
import { setupPixivnViteData } from "@drincs/pixi-vn/vite-listener";
import inkTexts from "virtual:pixi-vn-ink";
import inkJsonManifest from "./assets/ink-manifest.gen.json";

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
`;

void (async () => {
    const generatedJsonPath = inkJsonManifest?.[0];

    if (!generatedJsonPath) {
        console.warn("[vite-plugin-test] Nessun file JSON auto-generato trovato nel manifest.");
        return;
    }

    try {
        const response = await fetch(generatedJsonPath);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const generatedJson = await response.json();
        console.log(`[vite-plugin-test] Generated JSON (${generatedJsonPath}):`, generatedJson);
    } catch (error) {
        console.error("[vite-plugin-test] Errore durante il caricamento del JSON generato:", error);
    }
})();
