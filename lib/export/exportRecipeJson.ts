import { cacheDirectory, writeAsStringAsync } from 'expo-file-system/legacy';

import { recipeWithEmbeddedPhotos } from '@/lib/export/photos';
import { shareExportFile } from '@/lib/export/exportZip';
import type { RecipeExportEnvelope } from '@/types/export';
import type { Recipe } from '@/types/recipe';

export async function createExportRecipeJson(recipes: Recipe[]): Promise<string> {
  if (!cacheDirectory) throw new Error('ไม่พบโฟลเดอร์แคช');
  const withPhotos = await Promise.all(recipes.map((r) => recipeWithEmbeddedPhotos(r)));
  const envelope: RecipeExportEnvelope = {
    schemaVersion: 1,
    app: 'baan-chan-recipes',
    exportedAt: new Date().toISOString(),
    includesPhotos: true,
    format: 'recipe.json',
    recipes: withPhotos,
  };
  const outPath = `${cacheDirectory}suttr-export-${Date.now()}.recipe.json`;
  await writeAsStringAsync(outPath, JSON.stringify(envelope, null, 2));
  return outPath;
}

export async function shareRecipeJsonExport(recipes: Recipe[]): Promise<void> {
  const path = await createExportRecipeJson(recipes);
  await shareExportFile(path, 'application/json');
}
