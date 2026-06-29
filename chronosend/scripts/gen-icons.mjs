import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.resolve(__dirname, '..', 'apps', 'web', 'public', 'icons');

const icons = [
  {
    name: 'icon-192x192.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="32" fill="#3b82f6"/>
  <text x="96" y="120" text-anchor="middle" font-family="system-ui" font-size="80" font-weight="bold" fill="white">CS</text>
</svg>`,
  },
  {
    name: 'icon-512x512.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#3b82f6"/>
  <text x="256" y="310" text-anchor="middle" font-family="system-ui" font-size="200" font-weight="bold" fill="white">CS</text>
</svg>`,
  },
];

for (const icon of icons) {
  fs.writeFileSync(path.join(iconsDir, icon.name), icon.content);
  console.log(`Created ${icon.name}`);
}
