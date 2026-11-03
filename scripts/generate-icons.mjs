import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
const source = await readFile(
  new URL("../public/favicon.svg", import.meta.url),
);
const folder = new URL("../public/icons/", import.meta.url);
await mkdir(folder, { recursive: true });
for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  await sharp(source)
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(name, folder)));
}
// Solid edge-to-edge background with the entire cap inside the maskable safe circle.
const inset = await sharp(source).resize(400, 400).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: "#8429df" },
})
  .composite([{ input: inset, left: 56, top: 56 }])
  .png()
  .toFile(fileURLToPath(new URL("maskable-512.png", folder)));
