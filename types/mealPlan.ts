export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export type MealPlanDay = {
  date: string;
  meals: Partial<Record<MealSlot, string>>;
  /** Optional per-slot “done cooking” flags (backward compatible if omitted). */
  done?: Partial<Record<MealSlot, boolean>>;
};

export type MealPlanStore = {
  weekStart: string;
  days: MealPlanDay[];
};

export type ShoppingItem = {
  id: string;
  name: string;
  amount?: number;
  unit?: string;
  checked: boolean;
  sourceRecipeIds: string[];
  /** User-added or from “add missing to shopping”; kept across plan syncs */
  manual?: boolean;
};

export type ShoppingListStore = {
  items: ShoppingItem[];
  updatedAt: string;
};
