import { documentDirectory, getInfoAsync } from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';

import { loadAllMealPlanDays } from '@/lib/mealPlanStorage';
import { readJsonFile, writeJsonFileAtomic } from '@/lib/jsonFile';
import { addAmounts, mergeItemKey } from '@/lib/shoppingUnitMerge';
import { todayLocalIso } from '@/utils/localDate';
import type { FridgeItem } from '@/types/fridge';
import type { MealPlanDay, MealPlanStore, ShoppingItem, ShoppingListStore } from '@/types/mealPlan';
import type { Recipe } from '@/types/recipe';

const FILE = 'shopping-list.json';

function path(): string {
  if (!documentDirectory) throw new Error('no document dir');
  return `${documentDirectory}${FILE}`;
}

function fridgeStockByMergeKey(items: FridgeItem[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const f of items) {
    const key = mergeItemKey(f.name, f.unit);
    map.set(key, (map.get(key) ?? 0) + (f.quantity ?? 0));
  }
  return map;
}

export function filterPlanDaysFromToday(days: MealPlanDay[], today = todayLocalIso()): MealPlanDay[] {
  return days.filter((d) => d.date >= today);
}

export function generateShoppingItems(
  days: MealPlanDay[],
  recipesById: Map<string, Recipe>,
  fridgeItems: FridgeItem[] = [],
): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();
  const stock = fridgeStockByMergeKey(fridgeItems);

  for (const day of days) {
    for (const recipeId of Object.values(day.meals)) {
      if (!recipeId) continue;
      const recipe = recipesById.get(recipeId);
      if (!recipe) continue;
      for (const ing of recipe.ingredients) {
        const key = mergeItemKey(ing.name, ing.unit);
        const existing = map.get(key);
        if (existing) {
          const merged = addAmounts(existing.amount, existing.unit, ing.amount, ing.unit);
          existing.amount = merged.amount;
          existing.unit = merged.unit ?? existing.unit;
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
    const key = mergeItemKey(item.name, item.unit);
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
    return { items: [], dismissedPlanKeys: [], updatedAt: new Date().toISOString() };
  }
  const store = await readJsonFile<ShoppingListStore>(p, {
    items: [],
    dismissedPlanKeys: [],
    updatedAt: new Date().toISOString(),
  });
  if (!store.dismissedPlanKeys) store.dismissedPlanKeys = [];
  return store;
}

export async function saveShoppingList(
  items: ShoppingItem[],
  dismissedPlanKeys?: string[],
): Promise<void> {
  const prev = await loadShoppingList();
  const store: ShoppingListStore = {
    items,
    dismissedPlanKeys: dismissedPlanKeys ?? prev.dismissedPlanKeys ?? [],
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
    map.set(mergeItemKey(item.name, item.unit), { ...item });
  }
  for (const e of entries) {
    const key = mergeItemKey(e.name, e.unit);
    const existing = map.get(key);
    if (existing) {
      const merged = addAmounts(existing.amount, existing.unit, e.amount, e.unit);
      existing.amount = merged.amount;
      existing.unit = merged.unit ?? existing.unit;
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
  await saveShoppingList(items, prev.dismissedPlanKeys);
  return items;
}

export async function addManualShoppingItem(
  name: string,
  amount?: number,
  unit?: string,
): Promise<ShoppingItem[]> {
  const trimmed = name.trim();
  if (!trimmed) return (await loadShoppingList()).items;
  return mergeIntoShoppingList([{ name: trimmed, amount, unit }]);
}

export async function clearCheckedShoppingItems(): Promise<ShoppingItem[]> {
  const prev = await loadShoppingList();
  const dismissed = new Set(prev.dismissedPlanKeys ?? []);
  const removed = prev.items.filter((i) => i.checked);
  for (const item of removed) {
    if (!item.manual) {
      dismissed.add(mergeItemKey(item.name, item.unit));
    }
  }
  const items = prev.items.filter((i) => !i.checked);
  await saveShoppingList(items, [...dismissed]);
  return items;
}

/** Checked rows removed from list; caller adds them to the fridge. */
export async function takeCheckedShoppingItems(): Promise<ShoppingItem[]> {
  const prev = await loadShoppingList();
  const dismissed = new Set(prev.dismissedPlanKeys ?? []);
  const taken = prev.items.filter((i) => i.checked);
  for (const item of taken) {
    if (!item.manual) dismissed.add(mergeItemKey(item.name, item.unit));
  }
  const remaining = prev.items.filter((i) => !i.checked);
  await saveShoppingList(remaining, [...dismissed]);
  return taken;
}

export async function syncShoppingFromPlan(
  _plan: MealPlanStore,
  recipes: Recipe[],
  fridgeItems: FridgeItem[] = [],
): Promise<ShoppingItem[]> {
  const allDays = await loadAllMealPlanDays();
  const days = filterPlanDaysFromToday(allDays);
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const generated = generateShoppingItems(days, byId, fridgeItems);
  const prev = await loadShoppingList();
  const dismissed = new Set(prev.dismissedPlanKeys ?? []);
  const checked = new Map(
    prev.items.filter((i) => i.checked).map((i) => [mergeItemKey(i.name, i.unit), true]),
  );
  const manualItems = prev.items.filter((i) => i.manual);
  const map = new Map<string, ShoppingItem>();
  for (const item of generated) {
    const key = mergeItemKey(item.name, item.unit);
    if (dismissed.has(key)) continue;
    map.set(key, {
      ...item,
      checked: checked.get(key) ?? false,
    });
  }
  for (const m of manualItems) {
    const key = mergeItemKey(m.name, m.unit);
    if (!map.has(key)) {
      map.set(key, { ...m, checked: checked.get(key) ?? m.checked });
    }
  }
  const merged = [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'th'));
  await saveShoppingList(merged, prev.dismissedPlanKeys);
  return merged;
}
