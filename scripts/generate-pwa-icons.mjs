import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Approved artwork, copied unchanged from the user's ignored design directory.
const source = fileURLToPath(
  new URL("./assets/cashly-app-icon.png", import.meta.url),
);
const directory = new URL("../public/icons/", import.meta.url);
await mkdir(directory, { recursive: true });
// Regenerate owned outputs so a previous placeholder cannot survive this command.
for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
  ["favicon-16.png", 16],
  ["favicon-32.png", 32],
]) {
  await sharp(source)
    .flatten({ background: "#7357e8" })
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(name, directory)));
}

// Safari can discover this conventional path even without a page-specific link.
await copyFile(
  new URL("apple-touch-icon.png", directory),
  new URL("../public/apple-touch-icon.png", import.meta.url),
);

// Preserve the character inside the central safe circle. Extend only background
// edge pixels, keeping the opaque lavender canvas seamless and square.
await sharp(source)
  .flatten({ background: "#7357e8" })
  .resize(384, 384)
  .extend({ top: 64, bottom: 64, left: 64, right: 64, extendWith: "copy" })
  .png()
  .toFile(fileURLToPath(new URL("icon-maskable-512.png", directory)));

// ICO container with PNG frames, without an additional conversion dependency.
const sizes = [16, 32, 48];
const frames = await Promise.all(
  sizes.map((size) => sharp(source).resize(size, size).png().toBuffer()),
);
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
frames.forEach((frame, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(frame.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
});
await writeFile(
  new URL("../public/favicon.ico", import.meta.url),
  Buffer.concat([header, ...frames]),
);
console.log("Generated Cashly Mochi icons: PWA, maskable, Apple touch and favicon.");
