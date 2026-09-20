import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(resolve(root, 'public/icons/icon.svg'));
const outDir = resolve(root, 'public/icons');
mkdirSync(outDir, { recursive: true });

const bg = { r: 39, g: 76, b: 48, alpha: 1 };

async function make(size, file) {
  await sharp(svg).resize(size, size).png({ quality: 90, compressionLevel: 9 }).toFile(resolve(outDir, file));
}

await make(192, 'icon-192.png');
await make(512, 'icon-512.png');
await make(180, 'icon-180.png');

// Maskable variant: keep the glyph inside the 80% safe zone, full-bleed background.
const inner = Math.round(512 * 0.62);
const innerBuf = await sharp(svg).resize(inner, inner).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: bg },
})
  .composite([{ input: innerBuf, top: Math.round((512 - inner) / 2), left: Math.round((512 - inner) / 2) }])
  .png({ compressionLevel: 9 })
  .toFile(resolve(outDir, 'icon-maskable-512.png'));

console.log('icons generated');
