import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicDir = path.join(root, "public");
const buildDir = path.join(root, "build");
const source = path.join(publicDir, "app-icon.svg");

const targets = [
  { dir: publicDir, file: "pwa-192x192.png", size: 192, padding: 0 },
  { dir: publicDir, file: "pwa-512x512.png", size: 512, padding: 0 },
  { dir: publicDir, file: "apple-touch-icon.png", size: 180, padding: 0 },
  { dir: publicDir, file: "maskable-512x512.png", size: 512, padding: 64 },
  // electron-builder derives the Windows .ico from this one.
  { dir: buildDir, file: "icon.png", size: 512, padding: 0 },
];

await mkdir(publicDir, { recursive: true });
await mkdir(buildDir, { recursive: true });

for (const { dir, file, size, padding } of targets) {
  const inner = size - padding * 2;
  const icon = await sharp(source, { density: 384 }).resize(inner, inner).png().toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: padding ? "#2563eb" : { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: icon, top: padding, left: padding }])
    .png()
    .toFile(path.join(dir, file));
  console.log(`generated ${path.relative(root, path.join(dir, file))}`);
}
