import fs from "fs/promises";
import { ErrorType } from "inkjs/compiler/Parser/ErrorType";
import { createFilter, FilterPattern, Plugin } from "vite";
import { convertorInkToJson } from "../functions/ink";

/**
 * This function creates a Vite plugin that prevents Hot Module Replacement (HMR) for .ink files.
 * Instead of triggering HMR, it imports the .ink file using the `importInkText` function.
 * @returns A Vite plugin that prevents HMR for .ink files.
 */
export function vitePluginInk(
    options: {
        include?: FilterPattern;
        exclude?: FilterPattern;
    } = {}
): Plugin {
    let ws: any;
    const filter = createFilter(options.include || ["**/*.ink"], options.exclude);

    return {
        name: "vite-plugin-ink",
        enforce: "pre",

        configureServer(server) {
            ws = server.ws; // salva riferimento a WebSocket del dev server
        },
        async handleHotUpdate({ file, read }) {
            if (file.endsWith(".ink")) {
                const fileText = await read();

                // invia evento custom al client
                ws?.send({
                    type: "custom",
                    event: "ink-updated",
                    data: fileText,
                });

                return []; // evita HMR
            }
        },
        async transform(code, id) {
            if (!filter(id)) return null;
            const source = await fs.readFile(id, "utf-8");

            const { issues } = convertorInkToJson(source);

            // Se ci sono warning, li logghiamo ma NON blocchiamo la build
            if (issues && issues.length > 0) {
                issues.forEach((issue) => {
                    if (issue.type === ErrorType.Warning) {
                        this.warn(id + ": " + issue.message);
                    } else {
                        // Se è un errore, blocchiamo
                        this.error(id + ": " + issue.message);
                    }
                });
            }

            // esporta source
            return {
                code: `export default ${JSON.stringify(source)};`,
                map: null,
            };

            // * Convert ink to PixiVNJson during build (disabled for now because not used the browser environment, so don't know the pixi-vn character set, etc.)
            // return {
            //     code: `import { convertInkToJson } from "@drincs/pixi-vn-ink"; export default convertInkToJson(${JSON.stringify(
            //         source
            //     )});`,
            //     map: null,
            // };
        },
    };
}
