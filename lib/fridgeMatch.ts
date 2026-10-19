import { ingredientNamesMatch } from '@/lib/ingredientNormalize';
import { daysUntilExpiry, isFridgeItemExpired, isFridgeItemExpiringSoon } from '@/lib/fridgeStatus';
import type { FridgeIngredientMatch, FridgeItem, RecipeFridgeMatch } from '@/types/fridge';
import type { Recipe, RecipeIngredient } from '@/types/recipe';

function findMatchingItems(ingredient: RecipeIngredient, items: FridgeItem[]): FridgeItem[] {
  return items.filter((i) => ingredientNamesMatch(i.name, ingredient.name));
}

function amountSatisfied(
  ing: RecipeIngredient,
  item: FridgeItem,
): boolean {
  if (ing.amount == null) return item.quantity > 0;
  if (!ing.unit || !item.unit) return item.quantity >= ing.amount;
  if (ing.unit !== item.unit) return item.quantity > 0;
  return item.quantity >= ing.amount;
}

function matchIngredient(ing: RecipeIngredient, items: FridgeItem[]): FridgeIngredientMatch {
  const matches = findMatchingItems(ing, items);
  const fresh = matches.filter((i) => !isFridgeItemExpired(i));
  const expiredOnly = matches.length > 0 && fresh.length === 0;

  if (fresh.length === 0) {
    return {
      ingredientName: ing.name,
      requiredAmount: ing.amount,
      requiredUnit: ing.unit,
      have: false,
      expiredInFridge: expiredOnly,
      expiringSoon: false,
    };
  }

  const best = fresh.reduce((a, b) => (b.quantity > a.quantity ? b : a), fresh[0]);
  const have = amountSatisfied(ing, best);

  return {
    ingredientName: ing.name,
    requiredAmount: ing.amount,
    requiredUnit: ing.unit,
    have,
    availableAmount: best.quantity,
    availableUnit: best.unit,
    expiredInFridge: false,
    expiringSoon: isFridgeItemExpiringSoon(best),
  };
}

export function matchRecipeToFridge(recipe: Recipe, items: FridgeItem[]): RecipeFridgeMatch {
  const details = recipe.ingredients.map((ing) => matchIngredient(ing, items));
  const haveCount = details.filter((d) => d.have).length;
  const totalCount = details.length || 1;
  const percent = Math.round((haveCount / totalCount) * 100);
  const missing = details.filter((d) => !d.have).map((d) => d.ingredientName);
  const usesExpiring = details.some((d) => d.expiringSoon && d.have);

  return {
    recipeId: recipe.id,
    percent,
    haveCount,
    totalCount,
    missing,
    usesExpiring,
    details,
  };
}

export type CookMatchFilter = 'all' | 'complete' | 'missing2';

export function rankRecipeMatches(
  recipes: Recipe[],
  items: FridgeItem[],
  filter: CookMatchFilter,
  prioritizeExpiring: boolean,
): RecipeFridgeMatch[] {
  let list = recipes.map((r) => matchRecipeToFridge(r, items));

  if (filter === 'complete') {
    list = list.filter((m) => m.percent === 100);
  } else if (filter === 'missing2') {
    list = list.filter((m) => m.missing.length <= 2);
  }

  list.sort((a, b) => {
    if (prioritizeExpiring) {
      if (a.usesExpiring !== b.usesExpiring) return a.usesExpiring ? -1 : 1;
    }
    return b.percent - a.percent;
  });

  return list;
}

export function missingShoppingEntries(
  match: RecipeFridgeMatch,
  recipe: Recipe,
  servingsFactor = 1,
): { name: string; amount?: number; unit?: string }[] {
  const missingNames = new Set(match.missing);
  return recipe.ingredients
    .filter((i) => missingNames.has(i.name))
    .map((i) => ({
      name: i.name,
      amount: i.amount != null ? i.amount * servingsFactor : undefined,
      unit: i.unit,
    }));
}
