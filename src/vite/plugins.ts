import { Plugin } from "vite";

/**
 * This function creates a Vite plugin that prevents Hot Module Replacement (HMR) for .ink files.
 * Instead of triggering HMR, it imports the .ink file using the `importInkText` function.
 * @returns A Vite plugin that prevents HMR for .ink files.
 */
export function noHmrInkPlugin(): Plugin {
    let ws: any;

    return {
        name: "no-hmr-ink",
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
    };
}
