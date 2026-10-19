import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useFridge } from '@/context/FridgeContext';
import {
  loadMealPlan,
  setMealForDate,
  shiftMealPlanWeek,
  toggleMealDone as toggleMealDoneStorage,
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
  toggleMealDone: (date: string, slot: MealSlot) => Promise<void>;
  changeWeek: (offset: number) => Promise<void>;
  toggleShoppingItem: (id: string) => Promise<void>;
  rebuildShoppingList: () => Promise<void>;
};

const MealPlanContext = createContext<MealPlanContextValue | null>(null);

export function MealPlanProvider({ children }: { children: React.ReactNode }) {
  const { recipes } = useRecipes();
  const { items: fridgeItems } = useFridge();
  const [plan, setPlan] = useState<MealPlanStore | null>(null);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const rebuildShoppingList = useCallback(async () => {
    if (!plan) return;
    const items = await syncShoppingFromPlan(plan, recipes, fridgeItems);
    setShopping(items);
  }, [plan, recipes, fridgeItems]);

  const refresh = useCallback(async () => {
    const p = await loadMealPlan();
    setPlan(p);
    const items = await syncShoppingFromPlan(p, recipes, fridgeItems);
    setShopping(items);
  }, [recipes, fridgeItems]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (loading || !plan) return;
    void syncShoppingFromPlan(plan, recipes, fridgeItems).then(setShopping);
  }, [recipes, fridgeItems, plan?.weekStart, loading]);

  const assignMeal = useCallback(async (date: string, slot: MealSlot, recipeId?: string) => {
    const next = await setMealForDate(date, slot, recipeId);
    setPlan(next);
    const items = await syncShoppingFromPlan(next, recipes, fridgeItems);
    setShopping(items);
  }, [recipes, fridgeItems]);

  const toggleMealDone = useCallback(async (date: string, slot: MealSlot) => {
    const next = await toggleMealDoneStorage(date, slot);
    setPlan(next);
  }, []);

  const changeWeek = useCallback(async (offset: number) => {
    const next = await shiftMealPlanWeek(offset);
    setPlan(next);
    const items = await syncShoppingFromPlan(next, recipes, fridgeItems);
    setShopping(items);
  }, [recipes, fridgeItems]);

  const toggleShoppingItem = useCallback(async (id: string) => {
    const next = shopping.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
    setShopping(next);
    await saveShoppingList(next);
  }, [shopping]);

  const value = useMemo(
    () => ({
      plan,
      shopping,
      loading,
      refresh,
      assignMeal,
      toggleMealDone,
      changeWeek,
      toggleShoppingItem,
      rebuildShoppingList,
    }),
    [plan, shopping, loading, refresh, assignMeal, toggleMealDone, changeWeek, toggleShoppingItem, rebuildShoppingList],
  );

  return <MealPlanContext.Provider value={value}>{children}</MealPlanContext.Provider>;
}

export function useMealPlan() {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error('useMealPlan requires MealPlanProvider');
  return ctx;
}
