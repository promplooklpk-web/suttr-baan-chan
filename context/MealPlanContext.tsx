import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { emitFeedback } from '@/lib/feedbackBus';

import { useFridge } from '@/context/FridgeContext';
import {
  copyMealSlot,
  loadMealPlan,
  repeatMealOnWeekdays,
  setMealForDate,
  shiftMealPlanWeek,
  toggleMealDone as toggleMealDoneStorage,
} from '@/lib/mealPlanStorage';
import {
  addManualShoppingItem,
  clearCheckedShoppingItems,
  saveShoppingList,
  syncShoppingFromPlan,
  takeCheckedShoppingItems,
} from '@/lib/shoppingList';
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
  copyMeal: (fromDate: string, fromSlot: MealSlot, toDate: string, toSlot: MealSlot) => Promise<void>;
  repeatMealWeekdays: (date: string, slot: MealSlot, weekdayIndexes: number[]) => Promise<void>;
  addManualShopping: (name: string, amount?: number, unit?: string) => Promise<void>;
  clearPurchasedShopping: () => Promise<void>;
  takeCheckedForFridge: () => Promise<ShoppingItem[]>;
  setShoppingItems: (items: ShoppingItem[]) => Promise<void>;
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
    let cancelled = false;
    refresh().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    if (loading || !plan) return;
    let cancelled = false;
    void syncShoppingFromPlan(plan, recipes, fridgeItems).then((items) => {
      if (!cancelled) setShopping(items);
    });
    return () => {
      cancelled = true;
    };
  }, [recipes, fridgeItems, plan?.weekStart, loading]);

  const assignMeal = useCallback(async (date: string, slot: MealSlot, recipeId?: string) => {
    try {
      const next = await setMealForDate(date, slot, recipeId);
      setPlan(next);
      const items = await syncShoppingFromPlan(next, recipes, fridgeItems);
      setShopping(items);
    } catch {
      emitFeedback('ไม่สามารถบันทึกแผนมื้ออาหารได้', { error: true });
      throw new Error('ไม่สามารถบันทึกแผนมื้ออาหารได้');
    }
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

  const copyMeal = useCallback(
    async (fromDate: string, fromSlot: MealSlot, toDate: string, toSlot: MealSlot) => {
      const next = await copyMealSlot(fromDate, fromSlot, toDate, toSlot);
      setPlan(next);
      const items = await syncShoppingFromPlan(next, recipes, fridgeItems);
      setShopping(items);
    },
    [recipes, fridgeItems],
  );

  const repeatMealWeekdays = useCallback(
    async (date: string, slot: MealSlot, weekdayIndexes: number[]) => {
      const next = await repeatMealOnWeekdays(date, slot, weekdayIndexes);
      setPlan(next);
      const items = await syncShoppingFromPlan(next, recipes, fridgeItems);
      setShopping(items);
    },
    [recipes, fridgeItems],
  );

  const addManualShopping = useCallback(async (name: string, amount?: number, unit?: string) => {
    const items = await addManualShoppingItem(name, amount, unit);
    setShopping(items);
  }, []);

  const clearPurchasedShopping = useCallback(async () => {
    const items = await clearCheckedShoppingItems();
    setShopping(items);
  }, []);

  const takeCheckedForFridge = useCallback(async () => takeCheckedShoppingItems(), []);

  const setShoppingItems = useCallback(async (items: ShoppingItem[]) => {
    setShopping(items);
    await saveShoppingList(items);
  }, []);

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
      copyMeal,
      repeatMealWeekdays,
      addManualShopping,
      clearPurchasedShopping,
      takeCheckedForFridge,
      setShoppingItems,
    }),
    [
      plan,
      shopping,
      loading,
      refresh,
      assignMeal,
      toggleMealDone,
      changeWeek,
      toggleShoppingItem,
      rebuildShoppingList,
      copyMeal,
      repeatMealWeekdays,
      addManualShopping,
      clearPurchasedShopping,
      takeCheckedForFridge,
      setShoppingItems,
    ],
  );

  return <MealPlanContext.Provider value={value}>{children}</MealPlanContext.Provider>;
}

export function useMealPlan() {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error('useMealPlan requires MealPlanProvider');
  return ctx;
}
