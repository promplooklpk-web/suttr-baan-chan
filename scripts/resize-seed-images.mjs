/**
 * Resize bundled seed JPEGs in place (max 1200px long edge, ~q80).
 * Usage: node scripts/resize-seed-images.mjs [file-or-dir ...]
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedRoot = path.join(__dirname, '..', 'assets', 'seed');

async function collectJpegs(target) {
  const st = await stat(target);
  if (st.isFile() && /\.jpe?g$/i.test(target)) return [target];
  if (!st.isDirectory()) return [];
  const out = [];
  for (const name of await readdir(target)) {
    const p = path.join(target, name);
    const s = await stat(p);
    if (s.isDirectory()) out.push(...(await collectJpegs(p)));
    else if (/\.jpe?g$/i.test(name)) out.push(p);
  }
  return out;
}

async function resizeOne(file) {
  const img = sharp(file);
  const meta = await img.metadata();
  const long = Math.max(meta.width ?? 0, meta.height ?? 0);
  let pipeline = img.rotate();
  if (long > 1200) {
    pipeline = pipeline.resize(1200, 1200, { fit: 'inside', withoutEnlargement: true });
  }
  const buf = await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  const { writeFile } = await import('node:fs/promises');
  await writeFile(file, buf);
  const kb = (buf.length / 1024).toFixed(1);
  console.log(`${path.relative(seedRoot, file)}: ${meta.width}x${meta.height} -> ${kb} KB`);
}

async function main() {
  const args = process.argv.slice(2);
  const roots = args.length ? args.map((a) => path.resolve(a)) : [seedRoot];
  const files = [...new Set((await Promise.all(roots.map(collectJpegs))).flat())];
  for (const f of files.sort()) await resizeOne(f);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
