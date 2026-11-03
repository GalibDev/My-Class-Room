import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import sharp from "sharp";
const dist = new URL("../dist/", import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL("manifest.webmanifest", dist), "utf8"),
);
assert.equal(manifest.name, "My Class Room");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "/");
assert.equal(manifest.scope, "/");
assert.ok(manifest.icons.some((i) => i.purpose === "maskable"));
for (const icon of manifest.icons) {
  const { width, height } = await sharp(
    await readFile(new URL(icon.src.slice(1), dist)),
  ).metadata();
  assert.equal(`${width}x${height}`, icon.sizes);
}
const apple = await sharp(
  await readFile(new URL("icons/apple-touch-icon.png", dist)),
).metadata();
assert.equal(apple.width, 180);
assert.equal(apple.height, 180);
const html = await readFile(new URL("index.html", dist), "utf8");
assert.match(html, /manifest\.webmanifest/);
assert.match(html, /apple-touch-icon/);
const worker = await readFile(new URL("sw.js", dist), "utf8");
assert.match(worker, /index\.html/);
for (const file of await readdir(new URL("assets/", dist))) {
  if (/\.(js|css)$/.test(file))
    assert.ok(
      worker.includes(`assets/${file}`),
      `Offline precache is missing ${file}`,
    );
}
assert.ok(
  !worker.includes("firestore.googleapis.com"),
  "Do not cache Firebase API responses",
);
assert.match(worker, /SKIP_WAITING/, "Update action must be supported");
console.log(
  "PWA checks passed: standalone manifest, icon sizes, iOS metadata, complete app precache and update support.",
);
