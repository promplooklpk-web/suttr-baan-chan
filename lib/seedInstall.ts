import { Asset } from 'expo-asset';
import { copyAsync, documentDirectory } from 'expo-file-system/legacy';

import seedExport from '@/assets/seed/clean-recipes.json';
import { SEED_IMAGE_ASSETS } from '@/lib/seedAssets';
import type { Recipe } from '@/types/recipe';

type RawSeedRecipe = Recipe & {
  photoFile?: string;
};

function parseSeedNotes(notes?: string): { caloriesEstimate?: string; notes?: string } {
  if (!notes?.trim()) return {};
  const caloriesMatch = notes.match(/ประมาณ[^|]*กิโลแคลอรี[^|]*/);
  const caloriesEstimate = caloriesMatch?.[0].trim();
  let clean = notes;
  if (caloriesMatch) {
    clean = clean.replace(caloriesMatch[0], '').replace(/^\s*\|\s*/, '');
  }
  clean = clean.replace(/\|\s*เคล็ดลับ:.*$/s, '').trim();
  return {
    caloriesEstimate,
    notes: clean || undefined,
  };
}

async function copyBundledSeedImage(relativePath: string): Promise<void> {
  if (!documentDirectory) return;
  const fileName = relativePath.replace(/^images\//, '');
  const moduleId = SEED_IMAGE_ASSETS[fileName];
  if (!moduleId) {
    console.warn(`Seed image not bundled: ${fileName}`);
    return;
  }
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  if (!asset.localUri) return;
  const dest = `${documentDirectory}${relativePath}`;
  await copyAsync({ from: asset.localUri, to: dest });
}

export async function installSeedRecipes(): Promise<Recipe[]> {
  const rawRecipes = (seedExport as { recipes: RawSeedRecipe[] }).recipes;
  const installed: Recipe[] = [];

  for (const raw of rawRecipes) {
    const { photoFile: _pf, ...rest } = raw;
    const { caloriesEstimate, notes } = parseSeedNotes(raw.notes);
    const recipe: Recipe = {
      ...rest,
      notes,
      caloriesEstimate,
      isFavorite: raw.isFavorite ?? false,
    };

    if (recipe.photo?.path?.startsWith('images/')) {
      await copyBundledSeedImage(recipe.photo.path);
      if (!recipe.photo.mime) {
        recipe.photo.mime = 'image/jpeg';
      }
    }

    installed.push(recipe);
  }

  return installed;
}
