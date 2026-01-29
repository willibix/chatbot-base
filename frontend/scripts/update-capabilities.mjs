/* eslint-disable no-console */
/**
 * This script reads the VITE_API_URL from .env and updates the Tauri capabilities
 * to allow HTTP requests to that URL. Run this before `tauri android dev` or `tauri build`.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);

const frontendDir = join(currentDirPath, "..");
const rootDir = join(frontendDir, "..");
const capabilitiesPath = join(frontendDir, "src-tauri", "capabilities", "default.json");

// Find .env file - check root first, then frontend folder
function findEnvPath() {
    const rootEnvPath = join(rootDir, ".env");
    const frontendEnvPath = join(frontendDir, ".env");

    if (existsSync(rootEnvPath)) {
        console.log(`[update-capabilities] Using root .env: ${rootEnvPath}`);
        return rootEnvPath;
    }
    if (existsSync(frontendEnvPath)) {
        console.log(`[update-capabilities] Using frontend .env: ${frontendEnvPath}`);
        return frontendEnvPath;
    }
    return null;
}

// Read .env file and extract VITE_API_URL
function getApiUrlFromEnv() {
    const envPath = findEnvPath();

    if (!envPath) {
        console.log("[update-capabilities] No .env file found, using default localhost");
        return "http://localhost:8000";
    }

    const envContent = readFileSync(envPath, "utf-8");
    const match = envContent.match(/^VITE_API_URL=(.+)$/m);

    if (match) {
        // Extract just the origin (protocol + host + port) from the URL
        const url = new URL(match[1].trim());
        return `${url.protocol}//${url.host}`;
    }

    console.log("[update-capabilities] VITE_API_URL not found in .env, using default localhost");
    return "http://localhost:8000";
}

// Generate capabilities JSON with the correct URL
function generateCapabilities(apiBaseUrl) {
    return {
        $schema: "../gen/schemas/desktop-schema.json",
        identifier: "default",
        description: "Default capability for the main window",
        windows: ["main"],
        permissions: [
            "core:default",
            "shell:allow-open",
            "http:default",
            {
                identifier: "http:allow-fetch",
                allow: [
                    { url: "http://localhost" },
                    { url: "http://localhost:*" },
                    { url: "http://127.0.0.1" },
                    { url: "http://127.0.0.1:*" },
                    { url: "http://10.0.2.2" },
                    { url: "http://10.0.2.2:*" },
                    { url: apiBaseUrl },
                    { url: `${apiBaseUrl.replace(/:(\d+)$/, "")}:*` }, // Same host, any port
                    { url: "https://*" },
                ],
            },
        ],
    };
}

// Main
const apiUrl = getApiUrlFromEnv();
console.log(`[update-capabilities] API URL from .env: ${apiUrl}`);

const capabilities = generateCapabilities(apiUrl);
writeFileSync(capabilitiesPath, `${JSON.stringify(capabilities, null, 4)}\n`);

console.log(`[update-capabilities] Updated ${capabilitiesPath}`);
console.log("[update-capabilities] Allowed URLs:");
capabilities.permissions[3].allow.forEach((item) => console.log(`  - ${item.url}`));
