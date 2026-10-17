import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  loadMealPlan,
  setMealForDate,
  shiftMealPlanWeek,
} from '@/lib/mealPlanStorage';
import { loadShoppingList, saveShoppingList, syncShoppingFromPlan } from '@/lib/shoppingList';
import { useRecipes } from '@/context/RecipesContext';
import type { MealPlanStore, MealSlot, ShoppingItem } from '@/types/mealPlan';

type MealPlanContextValue = {
  plan: MealPlanStore | null;
  shopping: ShoppingItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  assignMeal: (date: string, slot: MealSlot, recipeId?: string) => Promise<void>;
  changeWeek: (offset: number) => Promise<void>;
  toggleShoppingItem: (id: string) => Promise<void>;
  rebuildShoppingList: () => Promise<void>;
};

const MealPlanContext = createContext<MealPlanContextValue | null>(null);

export function MealPlanProvider({ children }: { children: React.ReactNode }) {
  const { recipes } = useRecipes();
  const [plan, setPlan] = useState<MealPlanStore | null>(null);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const p = await loadMealPlan();
    setPlan(p);
    const s = await loadShoppingList();
    setShopping(s.items);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const assignMeal = useCallback(async (date: string, slot: MealSlot, recipeId?: string) => {
    const next = await setMealForDate(date, slot, recipeId);
    setPlan(next);
    const items = await syncShoppingFromPlan(next, recipes);
    setShopping(items);
  }, [recipes]);

  const changeWeek = useCallback(async (offset: number) => {
    const next = await shiftMealPlanWeek(offset);
    setPlan(next);
    const items = await syncShoppingFromPlan(next, recipes);
    setShopping(items);
  }, [recipes]);

  const toggleShoppingItem = useCallback(async (id: string) => {
    const next = shopping.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
    setShopping(next);
    await saveShoppingList(next);
  }, [shopping]);

  const rebuildShoppingList = useCallback(async () => {
    if (!plan) return;
    const items = await syncShoppingFromPlan(plan, recipes);
    setShopping(items);
  }, [plan, recipes]);

  const value = useMemo(
    () => ({
      plan,
      shopping,
      loading,
      refresh,
      assignMeal,
      changeWeek,
      toggleShoppingItem,
      rebuildShoppingList,
    }),
    [plan, shopping, loading, refresh, assignMeal, changeWeek, toggleShoppingItem, rebuildShoppingList],
  );

  return <MealPlanContext.Provider value={value}>{children}</MealPlanContext.Provider>;
}

export function useMealPlan() {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error('useMealPlan requires MealPlanProvider');
  return ctx;
}
