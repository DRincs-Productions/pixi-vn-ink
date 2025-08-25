import { ErrorType } from "inkjs/compiler/Parser/ErrorType";
import { Plugin } from "vite";
import { convertorInkToJson } from "../functions/ink";
import { logger } from "../functions/log-utility";

/**
 * This function creates a Vite plugin that prevents Hot Module Replacement (HMR) for .ink files.
 * Instead of triggering HMR, it imports the .ink file using the `importInkText` function.
 * @returns A Vite plugin that prevents HMR for .ink files.
 */
export function vitePluginInk(): Plugin {
    // options: {
    //     include?: FilterPattern;
    //     exclude?: FilterPattern;
    // } = {}
    let ws: any;
    // const filter = createFilter(options.include || ["**/*.ink"], options.exclude);

    return {
        name: "vite-plugin-ink",
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
            // only transform .ink files
            if (!id.endsWith(".ink")) {
                return null;
            }
            logger.info("Transforming .ink file: " + id);

            const { issues } = convertorInkToJson(code);

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
        },
    };
}
