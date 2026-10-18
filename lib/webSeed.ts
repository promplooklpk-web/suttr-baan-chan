import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

import { ONEDISH_SEED_IMAGE_ASSETS } from '@/lib/onedishSeedAssets';
import { SEED_IMAGE_ASSETS } from '@/lib/seedAssets';
import type { FridgeItem } from '@/types/fridge';
import type { Recipe } from '@/types/recipe';

/**
 * Debug-only: on web there is no document directory, so storage is empty.
 * Build/serve the web bundle with EXPO_PUBLIC_WEB_SEED=1 to load the bundled seed
 * recipes (with photos) plus a sample fridge in memory. Used by `npm run screenshots`.
 */
export const WEB_SEED_ENABLED =
  Platform.OS === 'web' && process.env.EXPO_PUBLIC_WEB_SEED === '1';

export function webSeedPhotoUri(relativePath?: string): string | undefined {
  if (!relativePath) return undefined;
  const file = relativePath.replace(/^images\//, '');
  const id = SEED_IMAGE_ASSETS[file] ?? ONEDISH_SEED_IMAGE_ASSETS[file];
  return id ? Asset.fromModule(id).uri : undefined;
}

export function webSeedFridge(recipes: Recipe[]): FridgeItem[] {
  const now = new Date().toISOString();
  const day = 86_400_000;
  const items: FridgeItem[] = [];
  const seen = new Set<string>();
  recipes.slice(0, 8).forEach((r, ri) => {
    r.ingredients.slice(0, 4).forEach((ing, ii) => {
      if (seen.has(ing.name)) return;
      seen.add(ing.name);
      items.push({
        id: `web-seed-${ri}-${ii}`,
        name: ing.name,
        quantity: 1000,
        unit: ing.unit ?? 'กรัม',
        place: 'chilled',
        expiresAt: new Date(Date.now() + ((ri + ii) % 5 === 0 ? 2 : 10) * day).toISOString(),
        addedAt: now,
        updatedAt: now,
      });
    });
  });
  return items;
}
