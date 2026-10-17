import { useMemo } from 'react';

import { useFridge } from '@/context/FridgeContext';
import { matchRecipeToFridge } from '@/lib/fridgeMatch';
import type { RecipeFridgeMatch } from '@/types/fridge';
import type { Recipe } from '@/types/recipe';

export type FridgeRecipeMatchesResult = {
  hasFridgeItems: boolean;
  percentById: Map<string, number>;
  matchById: Map<string, RecipeFridgeMatch>;
  getPercent: (recipeId: string) => number | undefined;
  getMatch: (recipeId: string) => RecipeFridgeMatch | undefined;
};

export function useFridgeRecipeMatches(recipes: Recipe[]): FridgeRecipeMatchesResult {
  const { items } = useFridge();

  return useMemo(() => {
    const percentById = new Map<string, number>();
    const matchById = new Map<string, RecipeFridgeMatch>();

    if (items.length === 0) {
      return {
        hasFridgeItems: false,
        percentById,
        matchById,
        getPercent: () => undefined,
        getMatch: () => undefined,
      };
    }

    for (const recipe of recipes) {
      const match = matchRecipeToFridge(recipe, items);
      matchById.set(recipe.id, match);
      if (match.percent > 0) {
        percentById.set(recipe.id, match.percent);
      }
    }

    return {
      hasFridgeItems: true,
      percentById,
      matchById,
      getPercent: (id: string) => percentById.get(id),
      getMatch: (id: string) => matchById.get(id),
    };
  }, [recipes, items]);
}
