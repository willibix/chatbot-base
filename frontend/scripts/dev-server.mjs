/* eslint-disable no-console */
/* global process */
/**
 * Smart dev server script that checks if Vite is already running before starting.
 * This allows running both desktop and Android Tauri apps simultaneously.
 */

import { connect } from "net";
import { exec } from "child_process";

const PORT = 1420;
const HOST = "localhost";

/**
 * Check if something is listening on the port by trying to connect
 */
function isPortListening(port, host = "localhost") {
    return new Promise((resolve) => {
        const socket = connect({ port, host });

        socket.once("connect", () => {
            socket.destroy();
            resolve(true); // Something is listening
        });

        socket.once("error", () => {
            socket.destroy();
            resolve(false); // Nothing listening
        });

        socket.setTimeout(1000, () => {
            socket.destroy();
            resolve(false);
        });
    });
}

async function main() {
    const isListening = await isPortListening(PORT, HOST);

    if (isListening) {
        // Port is already in use - assume Vite is running
        console.log(`[dev-server] Port ${PORT} is already in use.`);
        console.log(`[dev-server] Assuming Vite dev server is already running on http://${HOST}:${PORT}`);
        console.log("[dev-server] Skipping server start, using existing instance.");
        // Exit successfully - Tauri will connect to the existing server
        process.exit(0);
    }

    console.log(`[dev-server] Starting Vite dev server on http://${HOST}:${PORT}...`);

    // Start Vite dev server using exec (works better on Windows)
    const vite = exec("npm run dev", {
        cwd: process.cwd(),
    });

    // Pipe output to console
    vite.stdout?.pipe(process.stdout);
    vite.stderr?.pipe(process.stderr);

    vite.on("error", (err) => {
        console.error("[dev-server] Failed to start Vite:", err);
        process.exit(1);
    });

    vite.on("close", (code) => {
        process.exit(code ?? 0);
    });

    // Forward termination signals
    process.on("SIGINT", () => vite.kill("SIGINT"));
    process.on("SIGTERM", () => vite.kill("SIGTERM"));
}

main();
