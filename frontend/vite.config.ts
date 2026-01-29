import { resolve } from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],

    // Read .env from root directory (parent of frontend)
    envDir: resolve(__dirname, ".."),

    // Path aliases matching tsconfig.json
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
            "@/components": resolve(__dirname, "./src/components"),
            "@/pages": resolve(__dirname, "./src/pages"),
            "@/store": resolve(__dirname, "./src/store"),
            "@/services": resolve(__dirname, "./src/services"),
            "@/hooks": resolve(__dirname, "./src/hooks"),
            "@/types": resolve(__dirname, "./src/types"),
        },
    },

    // Vite options tailored for Tauri development
    clearScreen: false,

    // Tauri expects a fixed port
    server: {
        port: 1420,
        strictPort: true,
        host: true,
        // Tauri requires knowing where the dev server is
        watch: {
            ignored: ["**/src-tauri/**"],
        },
    },

    // Env prefix for client-side environment variables
    envPrefix: ["VITE_", "TAURI_"],

    build: {
        // Tauri uses Chromium on Windows and WebKit on macOS and Linux
        target: process.env.TAURI_PLATFORM === "windows" ? "chrome105" : "safari14",
        // Don't minify for debug builds
        minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
        // Produce sourcemaps for debug builds
        sourcemap: !!process.env.TAURI_DEBUG,
    },
});
