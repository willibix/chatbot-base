/* eslint-disable no-console */
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(scriptDir, "..", "public", "vite.svg");
const iconsDir = path.join(scriptDir, "..", "src-tauri", "icons");

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

const svgBuffer = fs.readFileSync(svgPath);

// Icon sizes needed for Tauri
const pngSizes = [32, 128, 256];

// Create ICO file from PNG buffers
function createIco(pngBuffers, sizes) {
    const numImages = pngBuffers.length;

    // ICO header: 6 bytes
    const headerSize = 6;
    // Directory entry: 16 bytes per image
    const dirEntrySize = 16;
    const dirSize = dirEntrySize * numImages;

    // Calculate total size and offsets
    let offset = headerSize + dirSize;
    const offsets = pngBuffers.map((buf) => {
        const currentOffset = offset;
        offset += buf.length;
        return currentOffset;
    });

    const totalSize = offset;
    const icoBuffer = Buffer.alloc(totalSize);

    // Write header
    icoBuffer.writeUInt16LE(0, 0); // Reserved
    icoBuffer.writeUInt16LE(1, 2); // Type: 1 = ICO
    icoBuffer.writeUInt16LE(numImages, 4); // Number of images

    // Write directory entries
    pngBuffers.forEach((pngBuf, i) => {
        const entryOffset = headerSize + i * dirEntrySize;
        const size = sizes[i];

        icoBuffer.writeUInt8(size === 256 ? 0 : size, entryOffset); // Width (0 = 256)
        icoBuffer.writeUInt8(size === 256 ? 0 : size, entryOffset + 1); // Height (0 = 256)
        icoBuffer.writeUInt8(0, entryOffset + 2); // Color palette
        icoBuffer.writeUInt8(0, entryOffset + 3); // Reserved
        icoBuffer.writeUInt16LE(1, entryOffset + 4); // Color planes
        icoBuffer.writeUInt16LE(32, entryOffset + 6); // Bits per pixel
        icoBuffer.writeUInt32LE(pngBuf.length, entryOffset + 8); // Image size
        icoBuffer.writeUInt32LE(offsets[i], entryOffset + 12); // Image offset
    });

    // Write image data
    pngBuffers.forEach((pngBuf, i) => {
        pngBuf.copy(icoBuffer, offsets[i]);
    });

    return icoBuffer;
}

async function generateIcons() {
    console.log("Generating icons from vite.svg...");

    // Generate PNG icons using Promise.all to avoid await-in-loop
    const pngPromises = pngSizes.map((size) => {
        const outputName = size === 256 ? "128x128@2x.png" : `${size}x${size}.png`;
        const outputPath = path.join(iconsDir, outputName);
        return sharp(svgBuffer)
            .resize(size, size)
            .png()
            .toFile(outputPath)
            .then(() => outputName);
    });

    const generatedPngs = await Promise.all(pngPromises);
    generatedPngs.forEach((name) => console.log(`  ✓ Generated ${name}`));

    // Generate icon.ico (Windows) - using 256x256 as base
    const icoPath = path.join(iconsDir, "icon.ico");
    const tempPngPath = icoPath.replace(".ico", ".png");
    await sharp(svgBuffer).resize(256, 256).png().toFile(tempPngPath);

    // For ICO, we'll create a multi-size ICO using sharp
    // ICO needs multiple sizes: 16, 32, 48, 256
    const icoSizes = [16, 32, 48, 256];
    const icoBuffers = await Promise.all(icoSizes.map((size) => sharp(svgBuffer).resize(size, size).png().toBuffer()));

    // Create ICO file manually (ICO format)
    const icoBuffer = createIco(icoBuffers, icoSizes);
    fs.writeFileSync(icoPath, icoBuffer);
    console.log("  ✓ Generated icon.ico");

    // Clean up temp file
    fs.unlinkSync(tempPngPath);

    // Generate icon.icns placeholder (macOS) - just copy 256x256 PNG for now
    // Real ICNS would need icns library, but for dev this works
    const icnsPath = path.join(iconsDir, "icon.icns");
    const tempIcnsPath = icnsPath.replace(".icns", "_512.png");
    await sharp(svgBuffer).resize(512, 512).png().toFile(tempIcnsPath);

    // For macOS, we'll just create a PNG that Tauri can work with in dev mode
    // In production builds, you'd want proper ICNS
    fs.copyFileSync(tempIcnsPath, icnsPath);
    fs.unlinkSync(tempIcnsPath);
    console.log("  ✓ Generated icon.icns (PNG placeholder)");

    console.log("\nIcons generated successfully!");
}

generateIcons().catch((err) => console.error(err));
