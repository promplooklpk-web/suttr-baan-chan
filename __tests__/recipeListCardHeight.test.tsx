import { RECIPE_LIST_CARD_MIN_HEIGHT, RecipeMenuCard } from '@/components/RecipeMenuCard';
import { seedFridgeItems, seedRecipe } from '@/__tests__/fixtures/seed';
import { matchRecipeToFridge } from '@/lib/fridgeMatch';
import { renderWithProviders } from '@/__tests__/testProviders';

describe('recipe list card layout', () => {
  it('exports a minimum list card height at least 72px', () => {
    expect(RECIPE_LIST_CARD_MIN_HEIGHT).toBeGreaterThanOrEqual(72);
  });

  it('renders list card with title and match percent visible', async () => {
    const match = matchRecipeToFridge(seedRecipe, seedFridgeItems);
    const { findByText, getByTestId } = renderWithProviders(
      <RecipeMenuCard
        recipe={seedRecipe}
        layout="list"
        fridgeMatch={match}
        showFridgeSection
        testID="recipe-list-card"
      />,
    );
    await findByText(seedRecipe.title);
    await findByText(/\d+%/);
    expect(getByTestId('recipe-list-card')).toBeTruthy();
  });
});
