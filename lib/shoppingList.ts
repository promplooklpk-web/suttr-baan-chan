import {
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';

import type { MealPlanStore } from '@/types/mealPlan';
import type { Recipe } from '@/types/recipe';
import type { ShoppingItem, ShoppingListStore } from '@/types/mealPlan';

const FILE = 'shopping-list.json';

function path(): string {
  if (!documentDirectory) throw new Error('no document dir');
  return `${documentDirectory}${FILE}`;
}

export function generateShoppingItems(
  plan: MealPlanStore,
  recipesById: Map<string, Recipe>,
): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();

  for (const day of plan.days) {
    for (const recipeId of Object.values(day.meals)) {
      if (!recipeId) continue;
      const recipe = recipesById.get(recipeId);
      if (!recipe) continue;
      for (const ing of recipe.ingredients) {
        const key = `${ing.name}|${ing.unit ?? ''}`;
        const existing = map.get(key);
        if (existing) {
          if (ing.amount != null) {
            existing.amount = (existing.amount ?? 0) + ing.amount;
          }
          if (!existing.sourceRecipeIds.includes(recipeId)) {
            existing.sourceRecipeIds.push(recipeId);
          }
        } else {
          map.set(key, {
            id: Crypto.randomUUID(),
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            checked: false,
            sourceRecipeIds: [recipeId],
          });
        }
      }
    }
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'th'));
}

export async function loadShoppingList(): Promise<ShoppingListStore> {
  const p = path();
  const info = await getInfoAsync(p);
  if (!info.exists) {
    return { items: [], updatedAt: new Date().toISOString() };
  }
  return JSON.parse(await readAsStringAsync(p)) as ShoppingListStore;
}

export async function saveShoppingList(items: ShoppingItem[]): Promise<void> {
  const store: ShoppingListStore = {
    items,
    updatedAt: new Date().toISOString(),
  };
  await writeAsStringAsync(path(), JSON.stringify(store, null, 2));
}

export async function syncShoppingFromPlan(
  plan: MealPlanStore,
  recipes: Recipe[],
): Promise<ShoppingItem[]> {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const generated = generateShoppingItems(plan, byId);
  const prev = await loadShoppingList();
  const checked = new Map(
    prev.items.filter((i) => i.checked).map((i) => [`${i.name}|${i.unit ?? ''}`, true]),
  );
  const merged = generated.map((item) => ({
    ...item,
    checked: checked.get(`${item.name}|${item.unit ?? ''}`) ?? false,
  }));
  await saveShoppingList(merged);
  return merged;
}
