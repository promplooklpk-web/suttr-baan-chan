import * as Crypto from 'expo-crypto';

import { loadRecipes, saveRecipes } from '@/lib/storage';
import type { DuplicatePolicy } from '@/types/export';
import type { Recipe } from '@/types/recipe';

export type ImportPlan = {
  recipe: Recipe;
  policy: DuplicatePolicy;
  isDuplicate: boolean;
};

export function buildImportPlan(
  incoming: Recipe[],
  existing: Recipe[],
): ImportPlan[] {
  const byId = new Map(existing.map((r) => [r.id, r]));
  return incoming.map((recipe) => {
    const dup = byId.has(recipe.id);
    return {
      recipe,
      isDuplicate: dup,
      policy: dup ? 'skip' : 'skip',
    };
  });
}

export async function applyImportPlan(plans: ImportPlan[]): Promise<number> {
  let recipes = await loadRecipes();
  let added = 0;

  for (const plan of plans) {
    const { recipe, policy, isDuplicate } = plan;
    if (!isDuplicate) {
      recipes = [recipe, ...recipes];
      added += 1;
      continue;
    }
    if (policy === 'skip') continue;
    if (policy === 'replace') {
      recipes = recipes.filter((r) => r.id !== recipe.id);
      recipes = [recipe, ...recipes];
      added += 1;
      continue;
    }
    if (policy === 'keep_both') {
      const newId = Crypto.randomUUID();
      const now = new Date().toISOString();
      const copy: Recipe = {
        ...recipe,
        id: newId,
        title: `${recipe.title} (นำเข้า)`,
        createdAt: now,
        updatedAt: now,
      };
      recipes = [copy, ...recipes];
      added += 1;
    }
  }

  await saveRecipes(recipes);
  return added;
}
