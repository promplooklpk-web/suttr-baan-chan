/**
 * Fail if any bundled v4 seed image exceeds MAX_BYTES or duplicates another file.
 * Usage: node scripts/check-seed-images.mjs
 */
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUNDLED_SEED_IMAGE_PATHS } from './seed-bundled-image-paths.mjs';

const MAX_BYTES = 400 * 1024;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

async function main() {
  const failures = [];
  const byHash = new Map();

  for (const rel of BUNDLED_SEED_IMAGE_PATHS) {
    const abs = path.join(root, rel);
    const st = await stat(abs);
    if (st.size > MAX_BYTES) {
      failures.push(`${rel}: ${(st.size / 1024).toFixed(1)} KB (max ${MAX_BYTES / 1024} KB)`);
    }
    const buf = await readFile(abs);
    const hash = createHash('sha256').update(buf).digest('hex');
    const other = byHash.get(hash);
    if (other) {
      failures.push(`${rel} is byte-identical to ${other} (sha256 ${hash.slice(0, 12)}…)`);
    } else {
      byHash.set(hash, rel);
    }
  }

  if (failures.length) {
    console.error('Seed image check failed:\n' + failures.join('\n'));
    process.exit(1);
  }
  console.log(
    `OK: ${BUNDLED_SEED_IMAGE_PATHS.length} seed images <= ${MAX_BYTES / 1024} KB, all unique`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
