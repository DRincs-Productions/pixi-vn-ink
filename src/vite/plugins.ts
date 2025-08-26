import fs from "fs/promises";
import { ErrorType } from "inkjs/compiler/Parser/ErrorType";
import { Plugin } from "vite";
import { convertorInkToJson } from "../functions/ink";

/**
 * This function creates a Vite plugin that prevents Hot Module Replacement (HMR) for .ink files.
 * Instead of triggering HMR, it imports the .ink file using the `importInkText` function.
 * @returns A Vite plugin that prevents HMR for .ink files.
 */
export function vitePluginInk(): Plugin {
    return {
        name: "vite-plugin-ink",
        enforce: "pre",

        async handleHotUpdate({ file, server, read }) {
            if (file.endsWith(".ink")) {
                // Leggiamo il contenuto modificato
                const source = await read();
                const { issues } = convertorInkToJson(source);

                let error: undefined | string = undefined;

                // Logghiamo eventuali warning/errori al terminale
                issues.forEach((issue) => {
                    if (issue.type === ErrorType.Warning) {
                        server.config.logger.warn(file + ": " + issue.message);
                    } else {
                        // Se è un errore, blocchiamo
                        server.config.logger.error(file + ": " + issue.message);
                        error = issue.message;
                    }
                });

                // Mostra overlay per errori
                if (error) {
                    server.ws.send({
                        type: "error",
                        err: {
                            message: error,
                            stack: file,
                            plugin: "vite-plugin-ink",
                        },
                    });
                } else {
                    // close server.hmr.overlay
                    server.ws.send({
                        type: "error",
                        err: null as any,
                    });

                    server.ws.send({
                        type: "custom",
                        event: "ink-updated",
                        data: source,
                    });
                }

                // NON restituiamo nulla => Vite non fa reload automatico della pagina
                return [];
            }
        },
        async transform(code, id) {
            if (!id.endsWith(".ink")) return null;

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
