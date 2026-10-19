jest.unmock('@/lib/storage');
jest.unmock('@/lib/mealPlanStorage');

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/mock/documents/',
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(async () => undefined),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
  moveAsync: jest.fn(),
}));

jest.mock('@/lib/seedInstall', () => ({
  __esModule: true,
  installCleanSeedRecipes: jest.fn(() =>
    Promise.resolve([
      {
        id: 'new-clean-1',
        title: 'New clean',
        ingredients: [{ name: 'x', amount: 1, unit: 'กรัม' }],
        steps: [{ text: 'step' }],
        createdAt: '',
        updatedAt: '',
      },
    ]),
  ),
  installOnedishSeedRecipes: jest.fn(() =>
    Promise.resolve([
      {
        id: 'new-onedish-1',
        title: 'New onedish',
        ingredients: [{ name: 'y', amount: 1, unit: 'กรัม' }],
        steps: [{ text: 'step' }],
        createdAt: '',
        updatedAt: '',
      },
    ]),
  ),
  collectRecipeImagePaths: jest.fn(() => []),
}));

import { SEED_PACK_V3_RECIPE_IDS } from '@/lib/seedPackV3Ids';

const recipesPath = '/mock/documents/recipes.json';
const mealPlanPath = '/mock/documents/meal-plan.json';
const v3Id = [...SEED_PACK_V3_RECIPE_IDS][0];
const userId = 'user-recipe-uuid-0001';

describe('seed migration v4', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('drops v3 seed recipes, keeps user recipes, and purges meal plan slots', async () => {
    const fs = require('expo-file-system/legacy') as typeof import('expo-file-system/legacy');
    const { initializeStorage } = require('@/lib/storage') as typeof import('@/lib/storage');

    const store = {
      schemaVersion: 1,
      app: 'baan-chan-recipes',
      exportedAt: '2026-01-01',
      seedVersion: 3,
      recipes: [
        {
          id: v3Id,
          title: 'Old seed',
          ingredients: [{ name: 'a', amount: 1, unit: 'กรัม' }],
          steps: [{ text: 's' }],
          isFavorite: true,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: userId,
          title: 'My recipe',
          ingredients: [{ name: 'b', amount: 1, unit: 'กรัม' }],
          steps: [{ text: 's' }],
          isFavorite: true,
          createdAt: '',
          updatedAt: '',
        },
      ],
    };

    const mealPlan = {
      version: 2,
      currentWeekStart: '2026-10-13',
      weeks: {
        '2026-10-13': [
          {
            date: '2026-10-13',
            meals: { lunch: v3Id, dinner: userId },
          },
        ],
      },
    };

    (fs.getInfoAsync as jest.Mock).mockImplementation(async (p: string) => {
      if (p.endsWith('images')) return { exists: true };
      if (p === recipesPath) return { exists: true };
      if (p === mealPlanPath) return { exists: true };
      return { exists: false };
    });

    (fs.readAsStringAsync as jest.Mock).mockImplementation(async (p: string) => {
      if (p === recipesPath) return JSON.stringify(store);
      if (p === mealPlanPath) return JSON.stringify(mealPlan);
      throw new Error(`unexpected read ${p}`);
    });

    let savedMealPlan: string | undefined;
    (fs.writeAsStringAsync as jest.Mock).mockImplementation(async (p: string, body: string) => {
      if (p.includes('meal-plan.json')) savedMealPlan = body;
    });

    const recipes = await initializeStorage();
    const ids = recipes.map((r) => r.id);
    expect(ids).toContain(userId);
    expect(ids).toContain('new-clean-1');
    expect(ids).toContain('new-onedish-1');
    expect(ids).not.toContain(v3Id);

    expect(savedMealPlan).toBeDefined();
    const parsed = JSON.parse(savedMealPlan!) as {
      weeks: Record<string, { date: string; meals: Record<string, string> }[]>;
    };
    const day = parsed.weeks['2026-10-13'][0];
    expect(day.meals.lunch).toBeUndefined();
    expect(day.meals.dinner).toBe(userId);
  });
});
