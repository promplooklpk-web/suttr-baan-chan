/**
 * Download v4 weight-loss seed photos from Wikimedia Commons (see IMAGE_CREDITS.md).
 * Usage: node scripts/fetch-wl-seed-images.mjs
 */
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedDir = path.join(__dirname, '..', 'assets', 'seed');
const onedishDir = path.join(seedDir, 'onedish');

/** @type {{ out: string; dir: 'seed' | 'onedish'; url: string }[]} */
const DOWNLOADS = [
  {
    out: 'wl-yum-khai-dao.jpg',
    dir: 'seed',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Boiled_Eggs_and_Tomato_slices_meal.jpg',
  },
  {
    out: 'wl-steamed-broccoli.jpg',
    dir: 'seed',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Liat_Portal_for_Foodie_Disorder_-_Steamed_Broccoli.jpg',
  },
  {
    out: 'wl-beef-broccoli-stirfry.jpg',
    dir: 'seed',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Beef_and_broccoli_stir_fry_closeup.jpg',
  },
  {
    out: 'wl-grilled-chicken-breast.jpg',
    dir: 'seed',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Grilled_Chicken_Breasts_%2828905381261%29.jpg',
  },
  {
    out: 'wl-chawanmushi.jpg',
    dir: 'seed',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Chawan-mushi.JPG',
  },
  {
    out: 'wl-grilled-pork-chops.jpg',
    dir: 'seed',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/81/Grilled_pork_chops.jpg',
  },
  {
    out: 'wl-grilled-chicken-plate.jpg',
    dir: 'onedish',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Grilled_Chicken_Breasts_%2828905381261%29.jpg',
  },
  {
    out: 'wl-egg-drop-soup.jpg',
    dir: 'onedish',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Egg_drop_soup.jpg',
  },
  {
    out: 'wl-pork-broccoli-dish.jpg',
    dir: 'onedish',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Dish_of_stewed_pork%2C_Romanesco_and_broccoli%2C_and_steamed_egg%2C_Singapore_-_20150129.jpg',
  },
  {
    out: 'wl-ginger-beef-stirfry.jpg',
    dir: 'onedish',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Morning_glory_with_mince_pork_by_Trisorn_Triboon.jpg',
  },
  {
    out: 'wl-kaphrao-rice-3.jpg',
    dir: 'onedish',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Organic_brown_rice%2C_pork%2C_kim_chi%2C_fried_egg_%288533213828%29.jpg',
  },
  {
    out: 'wl-ginger-chicken.jpg',
    dir: 'onedish',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Ginger_chicken_%283168342551%29.jpg',
  },
  {
    out: 'wl-clear-soup.jpg',
    dir: 'onedish',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Clear_Soup_2018-04-02_%281%29.jpg',
  },
  {
    out: 'wl-kaphrao-rice-1.jpg',
    dir: 'onedish',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Ka-phrao_mu_%28basil_fried_minced_pork%29_with_rice_%26_egg%2C_Bangkok%2C_2017-11-07_%281%29.jpg',
  },
  {
    out: 'wl-steamed-pork-egg.jpg',
    dir: 'onedish',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Steamed_Ground_Pork_with_Egg_%28Qi_Shui_Rou%29.jpg',
  },
];

async function resizeJpegBuffer(buf) {
  return sharp(buf)
    .rotate()
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
}

async function main() {
  await mkdir(seedDir, { recursive: true });
  await mkdir(onedishDir, { recursive: true });
  const ua = 'SuttrBaanChanSeedBot/1.0 (https://github.com/promplooklpk-web/suttr-baan-chan)';

  for (const item of DOWNLOADS) {
    await new Promise((r) => setTimeout(r, 2500));
    const dir = item.dir === 'onedish' ? onedishDir : seedDir;
    const dest = path.join(dir, item.out);
    const tmp = `${dest}.download`;
    const res = await fetch(item.url, { headers: { 'User-Agent': ua } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${item.out}`);
    const raw = Buffer.from(await res.arrayBuffer());
    await writeFile(tmp, raw);
    const out = await resizeJpegBuffer(raw);
    await writeFile(dest, out);
    await unlink(tmp).catch(() => {});
    console.log('wrote', dest, `(${(out.length / 1024).toFixed(1)} KB)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
