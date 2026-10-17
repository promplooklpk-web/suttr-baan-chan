import { ingredientNamesMatch, normalizeIngredientName } from '@/lib/ingredientNormalize';
import type { IngredientCatalogEntry } from '@/types/fridge';
import type { Recipe } from '@/types/recipe';

export function buildIngredientCatalog(recipes: Recipe[]): IngredientCatalogEntry[] {
  const map = new Map<string, { name: string; recipeIds: Set<string> }>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const key = normalizeIngredientName(ing.name);
      if (!key) continue;
      const existing = map.get(key);
      if (existing) {
        existing.recipeIds.add(recipe.id);
      } else {
        map.set(key, { name: ing.name.trim(), recipeIds: new Set([recipe.id]) });
      }
    }
  }

  return [...map.values()]
    .map((v) => ({
      id: normalizeIngredientName(v.name),
      name: v.name,
      recipeCount: v.recipeIds.size,
    }))
    .sort((a, b) => b.recipeCount - a.recipeCount || a.name.localeCompare(b.name, 'th'));
}

export function searchIngredientCatalog(
  catalog: IngredientCatalogEntry[],
  query: string,
  limit = 8,
): IngredientCatalogEntry[] {
  const q = normalizeIngredientName(query);
  if (!q) return [];
  return catalog
    .filter((e) => normalizeIngredientName(e.name).includes(q) || e.name.includes(query.trim()))
    .slice(0, limit);
}

export function catalogEntryForName(
  catalog: IngredientCatalogEntry[],
  name: string,
): IngredientCatalogEntry | undefined {
  return catalog.find((e) => ingredientNamesMatch(e.name, name));
}
