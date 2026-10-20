/**
 * Download v4 weight-loss seed photos from Wikimedia Commons (see IMAGE_CREDITS.md).
 * Usage: node scripts/fetch-wl-seed-images.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedDir = path.join(__dirname, '..', 'assets', 'seed');
const onedishDir = path.join(seedDir, 'onedish');

/** @type {{ out: string; dir: 'seed' | 'onedish'; url: string }[]} */
const DOWNLOADS = [
  {
    out: 'wl-yum-khai-dao.jpg',
    dir: 'seed',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Yum_Khai_Dao_%28Crispy_Egg_Salad%29_-_Rosa%27s_Thai_2025-07-22.jpg',
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
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Grilled_chicken_breast%2C_Santo_Domingo%2C_La_Palma.jpg',
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
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Ginger_beef_stir_fry.jpg',
  },
  {
    out: 'wl-kaphrao-rice-3.jpg',
    dir: 'onedish',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Ka-phrao_mu_%28basil_fried_minced_pork%29_with_rice_%26_egg%2C_Bangkok%2C_2017-11-07_%283%29.jpg',
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

function resizeJpeg(src, dest) {
  try {
    execFileSync(
      'convert',
      [src, '-resize', '1200x1200>', '-strip', '-quality', '85', dest],
      { stdio: 'pipe' },
    );
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(seedDir, { recursive: true });
  await mkdir(onedishDir, { recursive: true });
  const ua = 'SuttrBaanChanSeedBot/1.0 (https://github.com/promplooklpk-web/suttr-baan-chan)';

  for (const item of DOWNLOADS) {
    const dir = item.dir === 'onedish' ? onedishDir : seedDir;
    const dest = path.join(dir, item.out);
    const tmp = `${dest}.download`;
    const res = await fetch(item.url, { headers: { 'User-Agent': ua } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${item.out}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(tmp, buf);
    if (!resizeJpeg(tmp, dest)) {
      await writeFile(dest, buf);
    }
    try {
      await import('node:fs/promises').then((fs) => fs.unlink(tmp));
    } catch {
      /* ignore */
    }
    console.log('wrote', dest);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
