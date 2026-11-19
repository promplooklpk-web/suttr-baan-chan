/**
 * Headless screenshots of the exported Expo web build (393×852, light + dark).
 * Usage: EXPO_PUBLIC_WEB_SEED=1 npx expo export --platform web && node scripts/screenshot-screens.mjs
 */
import { mkdir } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist');
const outDir = process.env.SHOT_DIR ?? path.join(root, 'artifacts', 'screenshots');

const RECIPE_ID = 'b4010001-4a20-4f80-a001-000000000001';
const WEB_THEME_STORAGE_KEY = 'baan-chan-theme.json';

/** @type {{ name: string; path: string; setup?: (page: import('@playwright/test').Page) => Promise<void> }[]} */
const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'fridge', path: '/fridge' },
  { name: 'picker', path: '/picker' },
  { name: 'planner', path: '/planner' },
  { name: 'planner-shop', path: '/planner?section=shop' },
  { name: 'recipe', path: `/recipe/${RECIPE_ID}` },
  { name: 'settings', path: '/settings' },
  { name: 'search', path: '/search' },
  { name: 'recipe-edit', path: `/recipe/edit?id=${RECIPE_ID}` },
  { name: 'add-recipe', path: '/recipe/edit' },
  { name: 'recipe-cook', path: `/recipe/cook/${RECIPE_ID}` },
  { name: 'tags', path: '/tags' },
  { name: 'about', path: '/about' },
  { name: 'export-select', path: '/export/select' },
  {
    name: 'picker-filter-sheet',
    path: '/picker',
    setup: async (page) => {
      await page.getByLabel('ตัวกรอง').click({ timeout: 15_000 });
      await page.waitForTimeout(600);
    },
  },
  {
    name: 'fridge-add-sheet',
    path: '/fridge',
    setup: async (page) => {
      await page.getByLabel('เพิ่มของ').click({ timeout: 15_000 });
      await page.waitForTimeout(600);
    },
  },
  {
    name: 'add-sheet',
    path: '/',
    setup: async (page) => {
      await waitForSeededHome(page);
      await page.getByLabel('เพิ่มหรือสุ่มเมนู').click({ timeout: 15_000 });
      await page.waitForTimeout(600);
    },
  },
  { name: 'fridge-item', path: '/fridge/web-seed-0-0' },
  { name: 'fridge-match', path: `/fridge/match/${RECIPE_ID}` },
  { name: 'import-preview', path: '/import/preview' },
  { name: 'not-found', path: '/__not-found-screenshot__' },
];

function serveStatic(dir, port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = req.url?.split('?')[0] ?? '/';
      import('node:fs').then((fs) => {
        const tryFile = (p) => {
          fs.readFile(p, (err, data) => {
            if (err) {
              if (urlPath !== '/' && !urlPath.includes('.')) {
                fs.readFile(path.join(dir, 'index.html'), (e2, html) => {
                  if (e2) {
                    res.statusCode = 404;
                    res.end('Not found');
                  } else {
                    res.setHeader('Content-Type', 'text/html');
                    res.end(html);
                  }
                });
              } else {
                res.statusCode = 404;
                res.end('Not found');
              }
              return;
            }
            const ext = path.extname(p);
            const types = {
              '.html': 'text/html',
              '.js': 'application/javascript',
              '.css': 'text/css',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.svg': 'image/svg+xml',
              '.json': 'application/json',
              '.woff2': 'font/woff2',
            };
            res.setHeader('Content-Type', types[ext] ?? 'application/octet-stream');
            res.end(data);
          });
        };
        const safe = path.normalize(path.join(dir, urlPath === '/' ? 'index.html' : urlPath));
        if (!safe.startsWith(dir)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }
        tryFile(safe);
      });
    });
    server.listen(port, () => resolve(server));
    server.on('error', reject);
  });
}

const MIN_RECIPE_CARD_HEIGHT = 72;

async function assertHomeRecipeCardHeights(page) {
  const heights = await page.$$eval('[data-testid="recipe-list-card"]', (nodes) =>
    nodes.map((el) => el.getBoundingClientRect().height),
  );
  if (heights.length === 0) throw new Error('No recipe-list-card elements found');
  const tooShort = heights.filter((h) => h < MIN_RECIPE_CARD_HEIGHT);
  if (tooShort.length > 0) {
    throw new Error(
      `Home cards collapsed: ${tooShort.length}/${heights.length} below ${MIN_RECIPE_CARD_HEIGHT}px`,
    );
  }
}

async function waitForSeededHome(page) {
  await page.waitForSelector('[data-testid="recipe-list-card"]', { timeout: 90_000 });
  await page.waitForFunction(
    () => {
      const cards = document.querySelectorAll('[data-testid="recipe-list-card"]');
      const countEl = document.querySelector('[data-testid="home-recipe-count"]');
      const countText = countEl?.textContent ?? '';
      return (
        cards.length >= 10
        && /\d+ สูตร/.test(countText)
        && !countText.startsWith('0 สูตร')
        && document.querySelectorAll('img[src]').length >= 10
      );
    },
    { timeout: 90_000 },
  );
}

async function waitForRecipeEdit(page) {
  await page.waitForFunction(
    () => /แก้ไขสูตร/.test(document.body.innerText) && !/เพิ่มสูตรใหม่/.test(document.body.innerText),
    { timeout: 60_000 },
  );
}

async function waitForCookMode(page) {
  await page.waitForFunction(() => /ขั้นที่\s*1\//.test(document.body.innerText), { timeout: 60_000 });
  await page.waitForFunction(
    () => {
      const imgs = [...document.querySelectorAll('img[src]')].filter((img) => {
        const r = img.getBoundingClientRect();
        return r.width > 80 && r.height > 80 && r.top < 700;
      });
      return imgs.length > 0;
    },
    { timeout: 60_000 },
  );
}

async function assertLightBackground(page) {
  await page.waitForFunction(
    () => {
      const hasPref = (() => {
        try {
          const raw = localStorage.getItem('baan-chan-theme.json');
          return raw && JSON.parse(raw).preference === 'light';
        } catch {
          return false;
        }
      })();
      const hasCream = (() => {
        for (const el of document.querySelectorAll('div')) {
          const box = el.getBoundingClientRect();
          if (box.width < 280 || box.height < 500) continue;
          const bg = getComputedStyle(el).backgroundColor;
          const m = bg.match(/(\d+)/g);
          if (!m || m.length < 3) continue;
          const [r, g, b] = m.map(Number);
          if (r > 210 && g > 210 && b > 205) return true;
        }
        return false;
      })();
      return hasPref && hasCream;
    },
    { timeout: 45_000 },
  );
}

function installThemeInit(context, scheme) {
  const preference = scheme === 'light' ? 'light' : 'dark';
  return context.addInitScript((pref) => {
    globalThis.__WEB_SEED__ = true;
    try {
      localStorage.setItem('baan-chan-theme.json', JSON.stringify({ preference: pref }));
    } catch {
      /* ignore */
    }
  }, preference);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const port = 4173;
  const server = await serveStatic(distDir, port);
  const base = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const schemes = ['light', 'dark'];

  for (const scheme of schemes) {
    const context = await browser.newContext({
      ...devices['iPhone 14'],
      viewport: { width: 393, height: 852 },
      deviceScaleFactor: 1,
      colorScheme: scheme,
    });

    await installThemeInit(context, scheme);

    for (const route of ROUTES) {
      const page = await context.newPage();
      const url = `${base}${route.path}${route.path.includes('?') ? '&' : '?'}webSeed=1`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 });
      if (route.name === 'home') {
        await waitForSeededHome(page);
        await assertHomeRecipeCardHeights(page);
      } else if (route.name === 'recipe-edit') {
        await waitForRecipeEdit(page);
      } else if (route.name === 'recipe-cook') {
        await waitForCookMode(page);
      } else if (route.name === 'import-preview') {
        await page.waitForFunction(() => /นำเข้า|ซ้ำ|สูตรใหม่/.test(document.body.innerText), {
          timeout: 30_000,
        });
      } else if (route.name === 'planner-shop') {
        await page.waitForFunction(
          () => document.body.innerText.length > 80 && !/ยังไม่มีรายการซื้อ/.test(document.body.innerText),
          { timeout: 30_000 },
        ).catch(() => undefined);
      } else {
        await page.waitForTimeout(2200);
      }
      if (route.setup) await route.setup(page);
      await page.waitForTimeout(800);
      if (scheme === 'light') await assertLightBackground(page);
      const file = path.join(outDir, `${route.name}-${scheme}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`wrote ${file}`);
      await page.close();
    }

    await context.close();
  }

  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});