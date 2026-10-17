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

import { SEED_RECIPES } from '@/lib/seed';
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
  const info = await getInfoAsync(path);
  if (!info.exists) {
    return emptyStore();
  }
  const raw = await readAsStringAsync(path);
  const parsed = JSON.parse(raw) as RecipeStore;
  if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
    return emptyStore();
  }
  return parsed;
}

async function writeStore(recipes: Recipe[]): Promise<void> {
  const store = emptyStore(recipes);
  store.exportedAt = new Date().toISOString();
  await writeAsStringAsync(recipesPath(), JSON.stringify(store, null, 2));
}

export async function initializeStorage(): Promise<Recipe[]> {
  await ensureImagesDir();
  const store = await readStore();
  if (store.recipes.length === 0) {
    await writeStore(SEED_RECIPES);
    return SEED_RECIPES;
  }
  return store.recipes;
}

export async function loadRecipes(): Promise<Recipe[]> {
  await ensureImagesDir();
  const store = await readStore();
  return store.recipes;
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

export async function deleteRecipePhoto(relativePath?: string): Promise<void> {
  if (!relativePath || !documentDirectory) return;
  const full = `${documentDirectory}${relativePath}`;
  const info = await getInfoAsync(full);
  if (info.exists) {
    await deleteAsync(full, { idempotent: true });
  }
}

export function photoUri(relativePath?: string): string | undefined {
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
  if (recipe?.photo?.path) {
    await deleteRecipePhoto(recipe.photo.path);
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
