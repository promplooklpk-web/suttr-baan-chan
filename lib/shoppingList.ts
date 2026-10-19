import { documentDirectory, getInfoAsync } from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';

import { loadAllMealPlanDays } from '@/lib/mealPlanStorage';
import { readJsonFile, writeJsonFileAtomic } from '@/lib/jsonFile';
import type { FridgeItem } from '@/types/fridge';
import type { MealPlanDay, MealPlanStore, ShoppingItem, ShoppingListStore } from '@/types/mealPlan';
import type { Recipe } from '@/types/recipe';

const FILE = 'shopping-list.json';

function path(): string {
  if (!documentDirectory) throw new Error('no document dir');
  return `${documentDirectory}${FILE}`;
}

function itemKey(name: string, unit?: string): string {
  return `${name.trim().toLowerCase()}|${(unit ?? '').trim().toLowerCase()}`;
}

function fridgeStockByKey(items: FridgeItem[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const f of items) {
    const key = itemKey(f.name, f.unit);
    map.set(key, (map.get(key) ?? 0) + (f.quantity ?? 0));
  }
  return map;
}

export function generateShoppingItems(
  days: MealPlanDay[],
  recipesById: Map<string, Recipe>,
  fridgeItems: FridgeItem[] = [],
): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();
  const stock = fridgeStockByKey(fridgeItems);

  for (const day of days) {
    for (const recipeId of Object.values(day.meals)) {
      if (!recipeId) continue;
      const recipe = recipesById.get(recipeId);
      if (!recipe) continue;
      for (const ing of recipe.ingredients) {
        const key = itemKey(ing.name, ing.unit);
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
            manual: false,
          });
        }
      }
    }
  }

  const result: ShoppingItem[] = [];
  for (const item of map.values()) {
    const key = itemKey(item.name, item.unit);
    let need = item.amount ?? 0;
    const have = stock.get(key) ?? 0;
    if (need > 0 && have > 0) {
      need = Math.max(0, need - have);
    }
    if (need <= 0 && (item.amount == null || item.amount === 0)) {
      result.push(item);
      continue;
    }
    if (need <= 0) continue;
    result.push({ ...item, amount: need });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name, 'th'));
}

export async function loadShoppingList(): Promise<ShoppingListStore> {
  const p = path();
  const info = await getInfoAsync(p);
  if (!info.exists) {
    return { items: [], updatedAt: new Date().toISOString() };
  }
  return readJsonFile<ShoppingListStore>(p, {
    items: [],
    updatedAt: new Date().toISOString(),
  });
}

export async function saveShoppingList(items: ShoppingItem[]): Promise<void> {
  const store: ShoppingListStore = {
    items,
    updatedAt: new Date().toISOString(),
  };
  await writeJsonFileAtomic(path(), store);
}

export async function mergeIntoShoppingList(
  entries: { name: string; amount?: number; unit?: string; sourceRecipeId?: string }[],
): Promise<ShoppingItem[]> {
  const prev = await loadShoppingList();
  const map = new Map<string, ShoppingItem>();
  for (const item of prev.items) {
    map.set(itemKey(item.name, item.unit), { ...item });
  }
  for (const e of entries) {
    const key = itemKey(e.name, e.unit);
    const existing = map.get(key);
    if (existing) {
      if (e.amount != null) {
        existing.amount = (existing.amount ?? 0) + e.amount;
      }
      existing.manual = true;
      if (e.sourceRecipeId && !existing.sourceRecipeIds.includes(e.sourceRecipeId)) {
        existing.sourceRecipeIds.push(e.sourceRecipeId);
      }
    } else {
      map.set(key, {
        id: Crypto.randomUUID(),
        name: e.name,
        amount: e.amount,
        unit: e.unit,
        checked: false,
        sourceRecipeIds: e.sourceRecipeId ? [e.sourceRecipeId] : [],
        manual: true,
      });
    }
  }
  const items = [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'th'));
  await saveShoppingList(items);
  return items;
}

export async function syncShoppingFromPlan(
  _plan: MealPlanStore,
  recipes: Recipe[],
  fridgeItems: FridgeItem[] = [],
): Promise<ShoppingItem[]> {
  const days = await loadAllMealPlanDays();
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const generated = generateShoppingItems(days, byId, fridgeItems);
  const prev = await loadShoppingList();
  const checked = new Map(
    prev.items.filter((i) => i.checked).map((i) => [itemKey(i.name, i.unit), true]),
  );
  const manualItems = prev.items.filter((i) => i.manual);
  const map = new Map<string, ShoppingItem>();
  for (const item of generated) {
    map.set(itemKey(item.name, item.unit), {
      ...item,
      checked: checked.get(itemKey(item.name, item.unit)) ?? false,
    });
  }
  for (const m of manualItems) {
    const key = itemKey(m.name, m.unit);
    if (!map.has(key)) {
      map.set(key, { ...m, checked: checked.get(key) ?? m.checked });
    }
  }
  const merged = [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'th'));
  await saveShoppingList(merged);
  return merged;
}
