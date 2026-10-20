/**
 * Fail if any bundled v4 seed image exceeds MAX_BYTES.
 * Usage: node scripts/check-seed-images.mjs
 */
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 400 * 1024;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

/** @type {string[]} */
const BUNDLED = [
  'assets/seed/larb-gai.jpg',
  'assets/seed/egg-white-omelet.jpg',
  'assets/seed/grilled-chicken-salad.jpg',
  'assets/seed/tom-jued-tofu.jpg',
  'assets/seed/wl-yum-khai-dao.jpg',
  'assets/seed/wl-steamed-broccoli.jpg',
  'assets/seed/wl-beef-broccoli-stirfry.jpg',
  'assets/seed/wl-grilled-chicken-breast.jpg',
  'assets/seed/wl-chawanmushi.jpg',
  'assets/seed/wl-grilled-pork-chops.jpg',
  'assets/seed/onedish/khao-khai-jiao-pak-cover.jpg',
  'assets/seed/onedish/wl-clear-soup.jpg',
  'assets/seed/onedish/wl-egg-drop-soup.jpg',
  'assets/seed/onedish/wl-ginger-beef-stirfry.jpg',
  'assets/seed/onedish/wl-ginger-chicken.jpg',
  'assets/seed/onedish/wl-grilled-chicken-plate.jpg',
  'assets/seed/onedish/wl-kaphrao-rice-1.jpg',
  'assets/seed/onedish/wl-kaphrao-rice-3.jpg',
  'assets/seed/onedish/wl-pork-broccoli-dish.jpg',
  'assets/seed/onedish/wl-steamed-pork-egg.jpg',
];

async function main() {
  const failures = [];
  for (const rel of BUNDLED) {
    const abs = path.join(root, rel);
    const st = await stat(abs);
    if (st.size > MAX_BYTES) {
      failures.push(`${rel}: ${(st.size / 1024).toFixed(1)} KB (max ${MAX_BYTES / 1024} KB)`);
    }
  }
  if (failures.length) {
    console.error('Seed image size check failed:\n' + failures.join('\n'));
    process.exit(1);
  }
  console.log(`OK: ${BUNDLED.length} seed images <= ${MAX_BYTES / 1024} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
