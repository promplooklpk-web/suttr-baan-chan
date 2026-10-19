import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';

import {
  collectRecipeImagePaths,
  installCleanSeedRecipes,
  installOnedishSeedRecipes,
} from '@/lib/seedInstall';
import {
  CURRENT_SEED_VERSION,
  getEffectiveSeedVersion,
  isCleanSeedRecipeId,
  isLegacyRound1SeedId,
  isOnedishSeedRecipeId,
} from '@/lib/seedVersion';
import { webSeedEnabled, webSeedPhotoUri } from '@/lib/webSeed';
import { readJsonFile, writeJsonFileAtomic } from '@/lib/jsonFile';
import { sanitizeRecipes } from '@/lib/recipeSanitize';
import type { Recipe, RecipeInput, RecipeStore } from '@/types/recipe';

const RECIPES_FILE = 'recipes.json';
const IMAGES_DIR = 'images';

function recipesPath(): string {
  if (!documentDirectory) {
    throw new Error('ไม่พบโฟลเดอร์เอกสารของแอป');
  }
  return `${documentDirectory}${RECIPES_FILE}`;
}

function imagesDirPath(): string {
  if (!documentDirectory) {
    throw new Error('ไม่พบโฟลเดอร์เอกสารของแอป');
  }
  return `${documentDirectory}${IMAGES_DIR}`;
}

function photoRelativePath(recipeId: string, mime: string): string {
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  return `${IMAGES_DIR}/${recipeId}.${ext}`;
}

function emptyStore(recipes: Recipe[] = []): RecipeStore {
  return {
    schemaVersion: 1,
    app: 'baan-chan-recipes',
    exportedAt: new Date().toISOString(),
    includesPhotos: true,
    format: 'zip',
    recipes,
  };
}

async function ensureImagesDir(): Promise<void> {
  const dir = imagesDirPath();
  const info = await getInfoAsync(dir);
  if (!info.exists) {
    await makeDirectoryAsync(dir, { intermediates: true });
  }
}

async function readStore(): Promise<RecipeStore> {
  const path = recipesPath();
  const fallback = emptyStore();
  const parsed = await readJsonFile<RecipeStore>(path, fallback);
  if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
    return emptyStore();
  }
  parsed.recipes = sanitizeRecipes(parsed.recipes);
  return parsed;
}

async function writeStore(recipes: Recipe[], seedVersion = CURRENT_SEED_VERSION): Promise<void> {
  const store = emptyStore(sanitizeRecipes(recipes));
  store.exportedAt = new Date().toISOString();
  store.seedVersion = seedVersion;
  await writeJsonFileAtomic(recipesPath(), store);
}

export async function deleteRecipePhoto(relativePath?: string): Promise<void> {
  if (!relativePath || !documentDirectory) return;
  const full = `${documentDirectory}${relativePath}`;
  const info = await getInfoAsync(full);
  if (info.exists) {
    await deleteAsync(full, { idempotent: true });
  }
}

async function deleteAllRecipeImages(recipe: Recipe): Promise<void> {
  for (const path of collectRecipeImagePaths(recipe)) {
    await deleteRecipePhoto(path);
  }
}

function mergeSeedRecipes(clean: Recipe[], onedish: Recipe[], userRecipes: Recipe[]): Recipe[] {
  return [...clean, ...onedish, ...userRecipes];
}

function partitionRecipes(recipes: Recipe[]) {
  const clean = recipes.filter((r) => isCleanSeedRecipeId(r.id));
  const onedish = recipes.filter((r) => isOnedishSeedRecipeId(r.id));
  const user = recipes.filter(
    (r) => !isCleanSeedRecipeId(r.id) && !isOnedishSeedRecipeId(r.id) && !isLegacyRound1SeedId(r.id),
  );
  return { clean, onedish, user };
}

async function migrateToVersion2(recipes: Recipe[]): Promise<Recipe[]> {
  for (const recipe of recipes) {
    if (isLegacyRound1SeedId(recipe.id)) {
      await deleteAllRecipeImages(recipe);
    }
  }

  let { clean, user } = partitionRecipes(recipes.filter((r) => !isLegacyRound1SeedId(r.id)));

  if (clean.length > 0) {
    for (const recipe of clean) {
      await deleteAllRecipeImages(recipe);
    }
    clean = [];
  }

  const newClean = await installCleanSeedRecipes();
  return mergeSeedRecipes(newClean, [], user);
}

async function migrateToVersion3(recipes: Recipe[]): Promise<Recipe[]> {
  const { clean, onedish, user } = partitionRecipes(recipes);

  for (const recipe of onedish) {
    await deleteAllRecipeImages(recipe);
  }

  const newOnedish = await installOnedishSeedRecipes();
  return mergeSeedRecipes(clean, newOnedish, user);
}

async function migrateSeedData(store: RecipeStore): Promise<Recipe[]> {
  let recipes = store.recipes;
  let version = getEffectiveSeedVersion(store);

  if (version < 2) {
    recipes = await migrateToVersion2(recipes);
    version = 2;
  }

  if (version < 3) {
    recipes = await migrateToVersion3(recipes);
    version = 3;
  }

  await writeStore(recipes, CURRENT_SEED_VERSION);
  return recipes;
}

async function loadWebSeedRecipes(): Promise<Recipe[]> {
  return [...(await installCleanSeedRecipes()), ...(await installOnedishSeedRecipes())];
}

export async function initializeStorage(): Promise<Recipe[]> {
  if (webSeedEnabled()) return loadWebSeedRecipes();
  await ensureImagesDir();
  const store = await readStore();
  const effectiveVersion = getEffectiveSeedVersion(store);

  if (effectiveVersion < CURRENT_SEED_VERSION) {
    return migrateSeedData(store);
  }

  if (store.seedVersion !== CURRENT_SEED_VERSION) {
    await writeStore(store.recipes, CURRENT_SEED_VERSION);
  }

  return sanitizeRecipes(store.recipes);
}

export async function loadRecipes(): Promise<Recipe[]> {
  if (webSeedEnabled()) return loadWebSeedRecipes();
  await ensureImagesDir();
  const store = await readStore();
  return sanitizeRecipes(store.recipes);
}

export async function saveRecipes(recipes: Recipe[]): Promise<void> {
  await ensureImagesDir();
  await writeStore(recipes);
}

export function createRecipeId(): string {
  return Crypto.randomUUID();
}

export async function copyPhotoToStorage(
  sourceUri: string,
  recipeId: string,
  mime: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
): Promise<string> {
  await ensureImagesDir();
  const relative = photoRelativePath(recipeId, mime);
  const dest = `${documentDirectory}${relative}`;
  await copyAsync({ from: sourceUri, to: dest });
  return relative;
}

export function photoUri(relativePath?: string): string | undefined {
  if (webSeedEnabled()) return webSeedPhotoUri(relativePath);
  if (!relativePath || !documentDirectory) return undefined;
  return `${documentDirectory}${relativePath}`;
}

export async function addRecipe(input: RecipeInput, id?: string): Promise<Recipe> {
  const recipes = await loadRecipes();
  const now = new Date().toISOString();
  const recipe: Recipe = {
    ...input,
    id: id ?? createRecipeId(),
    createdAt: now,
    updatedAt: now,
  };
  recipes.unshift(recipe);
  await saveRecipes(recipes);
  return recipe;
}

export async function updateRecipe(id: string, patch: Partial<RecipeInput>): Promise<Recipe> {
  const recipes = await loadRecipes();
  const index = recipes.findIndex((r) => r.id === id);
  if (index < 0) {
    throw new Error('ไม่พบสูตร');
  }
  const updated: Recipe = {
    ...recipes[index],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };
  recipes[index] = updated;
  await saveRecipes(recipes);
  return updated;
}

export async function deleteRecipe(id: string): Promise<void> {
  const recipes = await loadRecipes();
  const recipe = recipes.find((r) => r.id === id);
  if (recipe) {
    await deleteAllRecipeImages(recipe);
  }
  const next = recipes.filter((r) => r.id !== id);
  await saveRecipes(next);
}

export function totalMinutes(recipe: Recipe): number {
  return (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
}

export function difficultyLabel(difficulty?: Recipe['difficulty']): string {
  switch (difficulty) {
    case 'easy':
      return 'ง่าย';
    case 'medium':
      return 'ปานกลาง';
    case 'hard':
      return 'ยาก';
    default:
      return 'ง่าย';
  }
}
