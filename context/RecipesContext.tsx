import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import {
  addRecipe as addRecipeStorage,
  deleteRecipe as deleteRecipeStorage,
  initializeStorage,
  loadRecipes,
  updateRecipe as updateRecipeStorage,
} from '@/lib/storage';
import type { Recipe, RecipeInput } from '@/types/recipe';

type RecipesContextValue = {
  recipes: Recipe[];
  loading: boolean;
  refresh: () => Promise<void>;
  addRecipe: (input: RecipeInput, id?: string) => Promise<Recipe>;
  updateRecipe: (id: string, patch: Partial<RecipeInput>) => Promise<Recipe>;
  deleteRecipe: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  getRecipe: (id: string) => Recipe | undefined;
  searchRecipes: (query: string) => Recipe[];
};

const RecipesContext = createContext<RecipesContextValue | null>(null);

export function RecipesProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await loadRecipes();
      setRecipes(data);
    } catch {
      setRecipes([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await initializeStorage();
        if (mounted) setRecipes(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const addRecipe = useCallback(async (input: RecipeInput, id?: string) => {
    const recipe = await addRecipeStorage(input, id);
    setRecipes((prev) => [recipe, ...prev]);
    return recipe;
  }, []);

  const updateRecipe = useCallback(async (id: string, patch: Partial<RecipeInput>) => {
    const recipe = await updateRecipeStorage(id, patch);
    setRecipes((prev) => prev.map((r) => (r.id === id ? recipe : r)));
    return recipe;
  }, []);

  const deleteRecipe = useCallback(async (id: string) => {
    await deleteRecipeStorage(id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const current = recipes.find((r) => r.id === id);
    if (!current) return;
    try {
      await updateRecipe(id, { isFavorite: !current.isFavorite });
    } catch {
      Alert.alert('บันทึกไม่สำเร็จ', 'ไม่สามารถอัปเดตสูตรโปรดได้');
    }
  }, [recipes, updateRecipe]);

  const getRecipe = useCallback(
    (id: string) => recipes.find((r) => r.id === id),
    [recipes],
  );

  const searchRecipes = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return recipes;
      return recipes.filter((recipe) => {
        if (recipe.title.toLowerCase().includes(q)) return true;
        if (recipe.tags?.some((t) => t.toLowerCase().includes(q))) return true;
        return recipe.ingredients.some(
          (ing) => ing?.name?.toLowerCase().includes(q) === true,
        );
      });
    },
    [recipes],
  );

  const value = useMemo(
    () => ({
      recipes,
      loading,
      refresh,
      addRecipe,
      updateRecipe,
      deleteRecipe,
      toggleFavorite,
      getRecipe,
      searchRecipes,
    }),
    [
      recipes,
      loading,
      refresh,
      addRecipe,
      updateRecipe,
      deleteRecipe,
      toggleFavorite,
      getRecipe,
      searchRecipes,
    ],
  );

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}

export function useRecipes() {
  const ctx = useContext(RecipesContext);
  if (!ctx) {
    throw new Error('useRecipes must be used within RecipesProvider');
  }
  return ctx;
}
