/**
 * Headless screenshots of the exported Expo web build (393×852, dark).
 * Usage: node scripts/screenshot-screens.mjs
 * Requires: EXPO_PUBLIC_WEB_SEED=1 npx expo export --platform web, @playwright/test, chromium.
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

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'fridge', path: '/fridge' },
  { name: 'picker', path: '/picker' },
  { name: 'planner', path: '/planner' },
  { name: 'recipe', path: '/recipe/6da6201a-3a01-4726-aa9a-5bcfc5c8d8c7' },
  { name: 'settings', path: '/settings' },
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
  if (heights.length === 0) {
    throw new Error('No recipe-list-card elements found for height assertion');
  }
  const tooShort = heights.filter((h) => h < MIN_RECIPE_CARD_HEIGHT);
  if (tooShort.length > 0) {
    throw new Error(
      `Home recipe cards collapsed: ${tooShort.length}/${heights.length} below ${MIN_RECIPE_CARD_HEIGHT}px (heights: ${heights.slice(0, 5).join(', ')}…)`,
    );
  }
  const titlesVisible = await page.$$eval('[data-testid="recipe-list-card"]', (nodes) =>
    nodes.slice(0, 3).map((card) => {
      const text = card.textContent ?? '';
      const hasTitle = text.length > 20 && /[\u0E00-\u0E7F]{4,}/.test(text);
      const hasPercent = /\d+%/.test(text);
      return { hasTitle, hasPercent, len: text.length };
    }),
  );
  const bad = titlesVisible.filter((t) => !t.hasTitle || !t.hasPercent);
  if (bad.length > 0) {
    throw new Error(`Home cards missing title or % in text snapshot: ${JSON.stringify(titlesVisible)}`);
  }
}

async function waitForSeededHome(page) {
  await page.waitForSelector('[data-testid="recipe-list-card"]', { timeout: 90_000 });
  await page.waitForFunction(
    () => {
      const cards = document.querySelectorAll('[data-testid="recipe-list-card"]');
      const countEl = document.querySelector('[data-testid="home-recipe-count"]');
      const countText = countEl?.textContent ?? '';
      const hasManyCards = cards.length >= 10;
      const hasRecipeCount = /\d+ สูตร/.test(countText) && !countText.startsWith('0 สูตร');
      const images = document.querySelectorAll('img[src]');
      const hasPhotos = images.length >= 10;
      return hasManyCards && hasRecipeCount && hasPhotos;
    },
    { timeout: 90_000 },
  );
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const port = 4173;
  const server = await serveStatic(distDir, port);
  const base = `http://127.0.0.1:${port}`;

  const iphone = devices['iPhone 14'];
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const context = await browser.newContext({
    ...iphone,
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  });

  await context.addInitScript(() => {
    globalThis.__WEB_SEED__ = true;
  });

  for (const route of ROUTES) {
    const page = await context.newPage();
    const url = `${base}${route.path}?webSeed=1`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 });
    if (route.name === 'home') {
      await waitForSeededHome(page);
      await assertHomeRecipeCardHeights(page);
    } else {
      await page.waitForTimeout(2500);
    }
    await page.waitForTimeout(800);
    const file = path.join(outDir, `${route.name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    const homeMeta =
      route.name === 'home'
        ? await page.evaluate(() => ({
            cards: document.querySelectorAll('[data-testid="recipe-list-card"]').length,
            count: document.querySelector('[data-testid="home-recipe-count"]')?.textContent,
            images: document.querySelectorAll('img[src]').length,
          }))
        : null;
    console.log(`wrote ${file}`, homeMeta ? JSON.stringify(homeMeta) : '');
    await page.close();
  }

  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
