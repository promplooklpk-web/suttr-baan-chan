import {
  documentDirectory,
  writeAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import type JSZip from 'jszip';

import { restoreExtraBackupFiles } from '@/lib/export/backupZip';
import type { Recipe, RecipePhoto } from '@/types/recipe';

async function copyZipImageToDocuments(fileName: string, base64: string): Promise<string> {
  const rel = `images/${fileName}`;
  if (!documentDirectory) return rel;
  await writeAsStringAsync(`${documentDirectory}${rel}`, base64, {
    encoding: EncodingType.Base64,
  });
  return rel;
}

function attachPathPhoto(photo: RecipePhoto | undefined, path: string): RecipePhoto | undefined {
  if (!photo) return undefined;
  return { ...photo, path, data: undefined };
}

export async function materializeRecipesFromZip(zip: JSZip, recipes: Recipe[]): Promise<Recipe[]> {
  const out: Recipe[] = [];
  for (const recipe of recipes) {
    const r: Recipe = JSON.parse(JSON.stringify(recipe));
    if (r.photo?.path) {
      const fileName = r.photo.path.replace(/^images\//, '');
      const entry = zip.file(`images/${fileName}`) ?? zip.file(fileName);
      if (entry) {
        const imgB64 = await entry.async('base64');
        const path = await copyZipImageToDocuments(fileName, imgB64);
        r.photo = attachPathPhoto(r.photo, path);
      }
    }
    for (let i = 0; i < r.steps.length; i++) {
      const step = r.steps[i];
      if (step.photo?.path) {
        const fileName = step.photo.path.replace(/^images\//, '');
        const entry = zip.file(`images/${fileName}`) ?? zip.file(fileName);
        if (entry) {
          const imgB64 = await entry.async('base64');
          const path = await copyZipImageToDocuments(fileName, imgB64);
          step.photo = attachPathPhoto(step.photo, path);
        }
      }
    }
    out.push(r);
  }
  return out;
}

export async function applyZipSideEffects(zip: JSZip): Promise<void> {
  await restoreExtraBackupFiles(zip);
}
