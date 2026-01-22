import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');
const svgPath = join(publicDir, 'timer-icon.svg');

const svgBuffer = readFileSync(svgPath);

// Generate 192x192 PNG
await sharp(svgBuffer)
  .resize(192, 192)
  .png()
  .toFile(join(publicDir, 'pwa-192x192.png'));

// Generate 512x512 PNG
await sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile(join(publicDir, 'pwa-512x512.png'));

// Generate 180x180 PNG for Apple touch icon
await sharp(svgBuffer)
  .resize(180, 180)
  .png()
  .toFile(join(publicDir, 'apple-touch-icon.png'));

// Generate favicon.png (32x32)
await sharp(svgBuffer)
  .resize(32, 32)
  .png()
  .toFile(join(publicDir, 'favicon.png'));

console.log('✅ Icons generated successfully!');
console.log('  - pwa-192x192.png');
console.log('  - pwa-512x512.png');
console.log('  - apple-touch-icon.png');
console.log('  - favicon.png');
