import { documentDirectory } from 'expo-file-system/legacy';

import { readJsonFile, writeJsonFileAtomic } from '@/lib/jsonFile';
import * as Crypto from 'expo-crypto';

import { webSeedEnabled, webSeedFridge } from '@/lib/webSeed';
import type { FridgeItem, FridgePlace, FridgeStore } from '@/types/fridge';

export const FRIDGE_FILE = 'fridge.json';

function path(): string {
  if (!documentDirectory) throw new Error('ไม่พบโฟลเดอร์เอกสารของแอป');
  return `${documentDirectory}${FRIDGE_FILE}`;
}

export async function loadFridgeStore(): Promise<FridgeStore> {
  if (webSeedEnabled()) {
    const { installCleanSeedRecipes } = await import('@/lib/seedInstall');
    return { items: webSeedFridge(await installCleanSeedRecipes()), updatedAt: new Date().toISOString() };
  }
  return readJsonFile<FridgeStore>(path(), {
    items: [],
    updatedAt: new Date().toISOString(),
  });
}

export async function saveFridgeStore(items: FridgeItem[]): Promise<FridgeStore> {
  const store: FridgeStore = {
    items,
    updatedAt: new Date().toISOString(),
  };
  await writeJsonFileAtomic(path(), store);
  return store;
}

function itemMergeKey(name: string, unit?: string): string {
  return `${name.trim().toLowerCase()}|${(unit ?? '').trim().toLowerCase()}`;
}

export async function addFridgeItem(
  input: Omit<FridgeItem, 'id' | 'addedAt' | 'updatedAt'>,
): Promise<FridgeItem> {
  const store = await loadFridgeStore();
  const now = new Date().toISOString();
  const key = itemMergeKey(input.name, input.unit);
  const existing = store.items.find((i) => itemMergeKey(i.name, i.unit) === key);
  if (existing) {
    const next: FridgeItem = {
      ...existing,
      quantity: (existing.quantity ?? 0) + (input.quantity ?? 0),
      place: input.place ?? existing.place,
      expiresAt: input.expiresAt ?? existing.expiresAt,
      note: input.note ?? existing.note,
      ingredientId: input.ingredientId ?? existing.ingredientId,
      updatedAt: now,
    };
    const idx = store.items.findIndex((i) => i.id === existing.id);
    store.items[idx] = next;
    await saveFridgeStore(store.items);
    return next;
  }
  const item: FridgeItem = {
    ...input,
    id: Crypto.randomUUID(),
    addedAt: now,
    updatedAt: now,
  };
  store.items.unshift(item);
  await saveFridgeStore(store.items);
  return item;
}

export async function updateFridgeItem(
  id: string,
  patch: Partial<Omit<FridgeItem, 'id' | 'addedAt'>>,
): Promise<FridgeItem | null> {
  const store = await loadFridgeStore();
  const idx = store.items.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  const next: FridgeItem = {
    ...store.items[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  store.items[idx] = next;
  await saveFridgeStore(store.items);
  return next;
}

export async function deleteFridgeItem(id: string): Promise<void> {
  const store = await loadFridgeStore();
  await saveFridgeStore(store.items.filter((i) => i.id !== id));
}

export async function subtractFridgeQuantity(
  id: string,
  subtract: number,
): Promise<FridgeItem | null> {
  if (subtract <= 0) return null;
  const store = await loadFridgeStore();
  const item = store.items.find((i) => i.id === id);
  if (!item) return null;
  const quantity = item.quantity - subtract;
  if (quantity <= 0) {
    await deleteFridgeItem(id);
    return null;
  }
  return updateFridgeItem(id, { quantity });
}

export const PLACE_LABELS: Record<FridgePlace, string> = {
  chilled: 'ช่องแช่เย็น',
  frozen: 'ช่องแช่แข็ง',
  dry: 'ของแห้ง',
};

export function sortFridgeItemsByExpiry(items: FridgeItem[]): FridgeItem[] {
  return [...items].sort((a, b) => {
    const ae = a.expiresAt ? new Date(a.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
    const be = b.expiresAt ? new Date(b.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
    return ae - be;
  });
}
