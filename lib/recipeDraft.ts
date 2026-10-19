import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RecipeIngredient, RecipeStep } from '@/types/recipe';

const KEY = 'recipe-form-draft-v1';

export type RecipeDraft = {
  title: string;
  category: string;
  minutes: string;
  servings: string;
  notes: string;
  tagsText: string;
  ingredients: RecipeIngredient[];
  amountTexts: string[];
  steps: RecipeStep[];
  updatedAt: string;
};

export async function loadRecipeDraft(): Promise<RecipeDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RecipeDraft;
  } catch {
    return null;
  }
}

export async function saveRecipeDraft(draft: RecipeDraft): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
}

export async function clearRecipeDraft(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
