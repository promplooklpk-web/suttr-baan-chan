import {
  documentDirectory,
  readAsStringAsync,
  writeAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';

import { collectRecipeImagePaths } from '@/lib/seedInstall';
import { deleteRecipePhoto, photoUri } from '@/lib/storage';
import type { Recipe, RecipePhoto } from '@/types/recipe';

export async function readPhotoAsBase64(relativePath?: string): Promise<RecipePhoto | undefined> {
  if (!relativePath || !documentDirectory) return undefined;
  const full = `${documentDirectory}${relativePath}`;
  try {
    const data = await readAsStringAsync(full, { encoding: EncodingType.Base64 });
    const ext = relativePath.split('.').pop()?.toLowerCase();
    const mime =
      ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    return { data, mime };
  } catch {
    return undefined;
  }
}

export async function recipeWithEmbeddedPhotos(recipe: Recipe): Promise<Recipe> {
  const clone: Recipe = JSON.parse(JSON.stringify(recipe));
  if (clone.photo?.path) {
    const embedded = await readPhotoAsBase64(clone.photo.path);
    if (embedded) {
      clone.photo = { ...clone.photo, ...embedded, path: undefined };
    }
  }
  for (const step of clone.steps) {
    if (step.photo?.path) {
      const embedded = await readPhotoAsBase64(step.photo.path);
      if (embedded) {
        step.photo = { ...step.photo, ...embedded, path: undefined };
      }
    }
  }
  return clone;
}

export async function writePhotoFromImport(
  photo: RecipePhoto | undefined,
  suggestedPath: string,
): Promise<RecipePhoto | undefined> {
  if (!photo || !documentDirectory) return photo;
  if (photo.path && photoUri(photo.path)) {
    return photo;
  }
  if (photo.data && photo.mime) {
    const dest = `${documentDirectory}${suggestedPath}`;
    await writeAsStringAsync(dest, photo.data, { encoding: EncodingType.Base64 });
    return { path: suggestedPath, mime: photo.mime };
  }
  return photo;
}

export async function materializeRecipePhotos(recipe: Recipe): Promise<Recipe> {
  const clone: Recipe = JSON.parse(JSON.stringify(recipe));
  if (clone.photo) {
    const ext = clone.photo.mime === 'image/png' ? 'png' : clone.photo.mime === 'image/webp' ? 'webp' : 'jpg';
    clone.photo = await writePhotoFromImport(clone.photo, `images/${clone.id}-cover.${ext}`);
  }
  for (let i = 0; i < clone.steps.length; i++) {
    const step = clone.steps[i];
    if (step.photo?.data) {
      const ext = step.photo.mime === 'image/png' ? 'png' : step.photo.mime === 'image/webp' ? 'webp' : 'jpg';
      step.photo = await writePhotoFromImport(
        step.photo,
        `images/${clone.id}-step-${i}.${ext}`,
      );
    }
  }
  return clone;
}

export async function deleteUnusedImportPaths(paths: string[]): Promise<void> {
  for (const p of paths) {
    await deleteRecipePhoto(p);
  }
}

export function allImagePaths(recipes: Recipe[]): string[] {
  return recipes.flatMap((r) => collectRecipeImagePaths(r));
}
