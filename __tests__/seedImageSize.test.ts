import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { BUNDLED_SEED_IMAGE_PATHS } from '@/lib/seedBundledImagePaths';

describe('bundled seed images', () => {
  it('stay under 400 KB each and are pairwise unique', () => {
    const script = path.join(__dirname, '..', 'scripts', 'check-seed-images.mjs');
    const out = execFileSync('node', [script], { encoding: 'utf8' });
    expect(out).toContain('OK:');
    expect(out).toContain('all unique');
  });

  it('have distinct content hashes (no duplicate covers)', () => {
    const root = path.join(__dirname, '..');
    const byHash = new Map<string, string>();
    for (const rel of BUNDLED_SEED_IMAGE_PATHS) {
      const buf = readFileSync(path.join(root, rel));
      const hash = createHash('sha256').update(buf).digest('hex');
      const other = byHash.get(hash);
      expect(other).toBeUndefined();
      byHash.set(hash, rel);
    }
    expect(byHash.size).toBe(BUNDLED_SEED_IMAGE_PATHS.length);
  });
});
