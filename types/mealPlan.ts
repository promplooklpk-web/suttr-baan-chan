export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export type MealPlanDay = {
  date: string;
  meals: Partial<Record<MealSlot, string>>;
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
};

export type ShoppingListStore = {
  items: ShoppingItem[];
  updatedAt: string;
};
