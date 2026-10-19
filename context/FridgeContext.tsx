import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { buildIngredientCatalog } from '@/lib/ingredientCatalog';
import { countAlertItems } from '@/lib/fridgeStatus';
import { usageSubtractAmount } from '@/lib/fridgeQuantity';
import {
  addFridgeItem,
  deleteFridgeItem,
  loadFridgeStore,
  subtractFridgeQuantity,
  updateFridgeItem,
} from '@/lib/fridgeStorage';
import { useRecipes } from '@/context/RecipesContext';
import { syncExpiryReminderSchedule } from '@/lib/expiryNotifications';
import type { FridgeItem, IngredientCatalogEntry } from '@/types/fridge';

type FridgeContextValue = {
  items: FridgeItem[];
  loading: boolean;
  alertCount: number;
  catalog: IngredientCatalogEntry[];
  refresh: () => Promise<void>;
  addItem: (input: Omit<FridgeItem, 'id' | 'addedAt' | 'updatedAt'>) => Promise<FridgeItem>;
  updateItem: (id: string, patch: Partial<Omit<FridgeItem, 'id' | 'addedAt'>>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  subtractAmount: (id: string, amount: number) => Promise<void>;
  usePreset: (id: string, preset: 'half' | 'quarter' | 'all') => Promise<void>;
};

const FridgeContext = createContext<FridgeContextValue | null>(null);

export function FridgeProvider({ children }: { children: React.ReactNode }) {
  const { recipes } = useRecipes();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const catalog = useMemo(() => buildIngredientCatalog(recipes), [recipes]);
  const alertCount = useMemo(() => countAlertItems(items), [items]);

  const refresh = useCallback(async () => {
    const store = await loadFridgeStore();
    setItems(store.items);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (loading) return;
    void syncExpiryReminderSchedule(items);
  }, [items, loading]);

  const addItem = useCallback(async (input: Omit<FridgeItem, 'id' | 'addedAt' | 'updatedAt'>) => {
    const item = await addFridgeItem(input);
    await refresh();
    return item;
  }, [refresh]);

  const updateItem = useCallback(async (id: string, patch: Partial<Omit<FridgeItem, 'id' | 'addedAt'>>) => {
    await updateFridgeItem(id, patch);
    await refresh();
  }, [refresh]);

  const removeItem = useCallback(async (id: string) => {
    await deleteFridgeItem(id);
    await refresh();
  }, [refresh]);

  const subtractAmount = useCallback(async (id: string, amount: number) => {
    await subtractFridgeQuantity(id, amount);
    await refresh();
  }, [refresh]);

  const usePreset = useCallback(async (id: string, preset: 'half' | 'quarter' | 'all') => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const amount = usageSubtractAmount(item, preset);
    await subtractFridgeQuantity(id, amount);
    await refresh();
  }, [items, refresh]);

  const value = useMemo(
    () => ({
      items,
      loading,
      alertCount,
      catalog,
      refresh,
      addItem,
      updateItem,
      removeItem,
      subtractAmount,
      usePreset,
    }),
    [items, loading, alertCount, catalog, refresh, addItem, updateItem, removeItem, subtractAmount, usePreset],
  );

  return <FridgeContext.Provider value={value}>{children}</FridgeContext.Provider>;
}

export function useFridge() {
  const ctx = useContext(FridgeContext);
  if (!ctx) throw new Error('useFridge requires FridgeProvider');
  return ctx;
}
