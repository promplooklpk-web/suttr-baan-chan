import {
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';

import type { FridgeItem, FridgePlace, FridgeStore } from '@/types/fridge';

export const FRIDGE_FILE = 'fridge.json';

function path(): string {
  if (!documentDirectory) throw new Error('ไม่พบโฟลเดอร์เอกสารของแอป');
  return `${documentDirectory}${FRIDGE_FILE}`;
}

export async function loadFridgeStore(): Promise<FridgeStore> {
  const p = path();
  const info = await getInfoAsync(p);
  if (!info.exists) {
    return { items: [], updatedAt: new Date().toISOString() };
  }
  return JSON.parse(await readAsStringAsync(p)) as FridgeStore;
}

export async function saveFridgeStore(items: FridgeItem[]): Promise<FridgeStore> {
  const store: FridgeStore = {
    items,
    updatedAt: new Date().toISOString(),
  };
  await writeAsStringAsync(path(), JSON.stringify(store, null, 2));
  return store;
}

export async function addFridgeItem(
  input: Omit<FridgeItem, 'id' | 'addedAt' | 'updatedAt'>,
): Promise<FridgeItem> {
  const store = await loadFridgeStore();
  const now = new Date().toISOString();
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
