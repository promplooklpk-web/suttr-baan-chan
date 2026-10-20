import { execFileSync } from 'node:child_process';
import path from 'node:path';

describe('bundled seed images', () => {
  it('stay under 400 KB each', () => {
    const script = path.join(__dirname, '..', 'scripts', 'check-seed-images.mjs');
    const out = execFileSync('node', [script], { encoding: 'utf8' });
    expect(out).toContain('OK:');
  });
});
