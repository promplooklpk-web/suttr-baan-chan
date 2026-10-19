jest.unmock('@/lib/storage');

jest.mock('@/lib/feedbackBus', () => ({
  emitFeedback: jest.fn(),
}));

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
        id: 'seed-1',
        title: 'Seed',
        ingredients: [{ name: 'test', amount: 1, unit: 'กรัม' }],
        steps: [{ text: 'step' }],
        createdAt: '',
        updatedAt: '',
      },
    ]),
  ),
  installOnedishSeedRecipes: jest.fn(() => Promise.resolve([])),
  collectRecipeImagePaths: jest.fn(() => []),
}));

const recipesPath = '/mock/documents/recipes.json';

describe('initializeStorage corrupt recipes', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('shows corrupt notice when recipes.json is bad and has no backup', async () => {
    const fs = require('expo-file-system/legacy') as typeof import('expo-file-system/legacy');
    const { emitFeedback } = require('@/lib/feedbackBus') as typeof import('@/lib/feedbackBus');
    const { initializeStorage } = require('@/lib/storage') as typeof import('@/lib/storage');

    (fs.getInfoAsync as jest.Mock).mockImplementation(async (p: string) => {
      if (p.endsWith('images')) return { exists: true };
      if (p === `${recipesPath}.bak`) return { exists: false };
      if (p === `${recipesPath}.tmp`) return { exists: false };
      if (p === recipesPath) return { exists: true };
      if (p === `${recipesPath}.corrupt`) return { exists: true };
      return { exists: false };
    });
    (fs.readAsStringAsync as jest.Mock).mockImplementation(async (p: string) => {
      if (p === recipesPath) throw new Error('parse error');
      throw new Error('missing');
    });
    (fs.moveAsync as jest.Mock).mockResolvedValue(undefined);

    const recipes = await initializeStorage();
    expect(recipes.some((r) => r.id === 'seed-1')).toBe(true);
    expect(emitFeedback).toHaveBeenCalledWith(
      expect.stringContaining('recipes.json.corrupt'),
      { error: true },
    );
  });
});
