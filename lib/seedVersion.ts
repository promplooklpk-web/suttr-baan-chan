import cleanExport from '@/assets/seed/clean-recipes.json';
import onedishExport from '@/assets/seed/onedish/recipes.json';
import type { RecipeStore } from '@/types/recipe';

/** Round 1 placeholder recipes (replaced in seed v2). */
export const LEGACY_ROUND1_SEED_IDS = new Set([
  '6f1c2a3e-8d41-4b7e-9a10-2c5d7e9f0a11',
  'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  'b2c3d4e5-f6a7-4890-b123-456789abcdef',
  'c3d4e5f6-a7b8-4901-c234-56789abcdef0',
]);

export const CURRENT_SEED_VERSION = 3;

export const CLEAN_SEED_RECIPE_IDS = new Set(
  (cleanExport as { recipes: { id: string }[] }).recipes.map((r) => r.id),
);

export const ONEDISH_SEED_RECIPE_IDS = new Set(
  (onedishExport as { recipes: { id: string }[] }).recipes.map((r) => r.id),
);

export function isLegacyRound1SeedId(id: string): boolean {
  return LEGACY_ROUND1_SEED_IDS.has(id);
}

export function isCleanSeedRecipeId(id: string): boolean {
  return CLEAN_SEED_RECIPE_IDS.has(id);
}

export function isOnedishSeedRecipeId(id: string): boolean {
  return ONEDISH_SEED_RECIPE_IDS.has(id);
}

export function isBundledSeedRecipeId(id: string): boolean {
  return isCleanSeedRecipeId(id) || isOnedishSeedRecipeId(id);
}

/**
 * Resolve seed pack version when `seedVersion` was not stored (older app builds).
 */
export function getEffectiveSeedVersion(store: RecipeStore): number {
  if (store.seedVersion != null) {
    return store.seedVersion;
  }
  if (store.recipes.length === 0) {
    return 0;
  }
  if (store.recipes.some((r) => isLegacyRound1SeedId(r.id))) {
    return 1;
  }
  if (store.recipes.some((r) => isOnedishSeedRecipeId(r.id))) {
    return CURRENT_SEED_VERSION;
  }
  if (store.recipes.some((r) => isCleanSeedRecipeId(r.id))) {
    return 2;
  }
  return CURRENT_SEED_VERSION;
}
