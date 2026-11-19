import cleanExport from '@/assets/seed/clean-recipes.json';
import { buildImportPlan } from '@/lib/export/applyImport';
import type { RecipeExportEnvelope } from '@/types/export';
import { webSeedEnabled } from '@/lib/webSeed';
import type { Recipe } from '@/types/recipe';

let cached: ReturnType<typeof buildWebSeedPending> | null = null;

function buildWebSeedPending() {
  const envelopeRecipes = cleanExport.recipes.slice(0, 4) as Recipe[];
  const existing = cleanExport.recipes.slice(0, 2) as Recipe[];
  const plans = buildImportPlan(envelopeRecipes, existing).map((p, i) =>
    i === 1 ? { ...p, isDuplicate: true, policy: 'skip' as const } : p,
  );
  const envelope: RecipeExportEnvelope = {
    schemaVersion: 1,
    app: 'baan-chan-recipes',
    exportedAt: new Date().toISOString(),
    includesPhotos: true,
    format: 'zip',
    recipes: envelopeRecipes,
  };
  return {
    envelope,
    plans,
    zip: null,
    zipUri: null,
    skippedRecipeCount: 1,
  };
}

export function getWebSeedPendingImport() {
  if (!webSeedEnabled()) return null;
  if (!cached) cached = buildWebSeedPending();
  return cached;
}