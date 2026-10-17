import type { Recipe } from '@/types/recipe';

export type ExportFormat = 'zip' | 'recipe.json';

export type RecipeExportEnvelope = {
  schemaVersion: 1;
  app: 'baan-chan-recipes';
  exportedAt: string;
  includesPhotos?: boolean;
  format?: ExportFormat;
  recipes: Recipe[];
};

export type DuplicatePolicy = 'skip' | 'keep_both' | 'replace';

export type ImportPreviewItem = {
  recipe: Recipe;
  isDuplicate: boolean;
  existingTitle?: string;
  policy: DuplicatePolicy;
};
