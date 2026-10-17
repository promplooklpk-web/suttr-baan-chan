import { render } from '@testing-library/react-native';

import { RecipeMenuCard } from '@/components/RecipeMenuCard';
import { matchRecipeToFridge } from '@/lib/fridgeMatch';
import { seedFridgeItems, seedRecipe } from '@/__tests__/fixtures/seed';

describe('RecipeMenuCard', () => {
  it('renders grid layout without Slot style error', () => {
    const match = matchRecipeToFridge(seedRecipe, seedFridgeItems);
    expect(() =>
      render(
        <RecipeMenuCard
          recipe={seedRecipe}
          layout="grid"
          fridgeMatch={match}
          showFridgeSection
        />,
      ),
    ).not.toThrow();
  });

  it('renders list layout with array styles flattened for Link asChild', () => {
    const match = matchRecipeToFridge(seedRecipe, seedFridgeItems);
    expect(() =>
      render(
        <RecipeMenuCard
          recipe={seedRecipe}
          layout="list"
          fridgeMatch={match}
          showFridgeSection
        />,
      ),
    ).not.toThrow();
  });
});
