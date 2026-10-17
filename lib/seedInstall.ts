import { Asset } from 'expo-asset';
import { copyAsync, documentDirectory } from 'expo-file-system/legacy';

import cleanExport from '@/assets/seed/clean-recipes.json';
import onedishExport from '@/assets/seed/onedish/recipes.json';
import { ONEDISH_SEED_IMAGE_ASSETS } from '@/lib/onedishSeedAssets';
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
  clean = clean
    .replace(/\|\s*เคล็ดลับ:.*$/s, '')
    .replace(/\|\s*แหล่งอ้างอิง:.*$/s, '')
    .replace(/\|\s*หมายเหตุภาพ:.*$/s, '')
    .trim();
  return {
    caloriesEstimate,
    notes: clean || undefined,
  };
}

async function copyBundledSeedImage(
  relativePath: string,
  assets: Record<string, number>,
): Promise<void> {
  if (!documentDirectory) return;
  const fileName = relativePath.replace(/^images\//, '');
  const moduleId = assets[fileName];
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

async function copyAllRecipeImages(
  recipe: Recipe,
  assets: Record<string, number>,
): Promise<void> {
  const paths = new Set<string>();
  if (recipe.photo?.path?.startsWith('images/')) {
    paths.add(recipe.photo.path);
  }
  for (const step of recipe.steps) {
    if (step.photo?.path?.startsWith('images/')) {
      paths.add(step.photo.path);
    }
  }
  for (const path of paths) {
    await copyBundledSeedImage(path, assets);
  }
}

async function installFromExport(
  exportData: { recipes: RawSeedRecipe[] },
  assets: Record<string, number>,
): Promise<Recipe[]> {
  const installed: Recipe[] = [];

  for (const raw of exportData.recipes) {
    const { photoFile: _pf, ...rest } = raw;
    const { caloriesEstimate, notes } = parseSeedNotes(raw.notes);
    const recipe: Recipe = {
      ...rest,
      notes,
      caloriesEstimate,
      isFavorite: raw.isFavorite ?? false,
    };

    await copyAllRecipeImages(recipe, assets);

    if (recipe.photo && !recipe.photo.mime) {
      recipe.photo.mime = 'image/jpeg';
    }
    for (const step of recipe.steps) {
      if (step.photo && !step.photo.mime) {
        step.photo.mime = 'image/jpeg';
      }
    }

    installed.push(recipe);
  }

  return installed;
}

export async function installCleanSeedRecipes(): Promise<Recipe[]> {
  return installFromExport(cleanExport as { recipes: RawSeedRecipe[] }, SEED_IMAGE_ASSETS);
}

/** @deprecated use installCleanSeedRecipes */
export async function installSeedRecipes(): Promise<Recipe[]> {
  return installCleanSeedRecipes();
}

export async function installOnedishSeedRecipes(): Promise<Recipe[]> {
  return installFromExport(onedishExport as { recipes: RawSeedRecipe[] }, ONEDISH_SEED_IMAGE_ASSETS);
}

export function collectRecipeImagePaths(recipe: Recipe): string[] {
  const paths: string[] = [];
  if (recipe.photo?.path) paths.push(recipe.photo.path);
  for (const step of recipe.steps) {
    if (step.photo?.path) paths.push(step.photo.path);
  }
  return paths;
}
