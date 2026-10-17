import {
  documentDirectory,
  readAsStringAsync,
  writeAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import JSZip from 'jszip';

import { validateExportEnvelope } from '@/lib/export/validate';
import type { RecipeExportEnvelope } from '@/types/export';
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

export async function parseImportFile(
  uri: string,
  mimeType?: string | null,
  name?: string | null,
): Promise<{ ok: true; envelope: RecipeExportEnvelope } | { ok: false; errors: string[] }> {
  const lowerName = (name ?? uri).toLowerCase();
  const isZip = lowerName.endsWith('.zip') || mimeType?.includes('zip');

  if (isZip) {
    const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
    const zip = await JSZip.loadAsync(base64, { base64: true });
    const recipesFile = zip.file('recipes.json');
    if (!recipesFile) {
      return { ok: false, errors: ['ไม่พบ recipes.json ในไฟล์ zip'] };
    }
    const jsonText = await recipesFile.async('string');
    const parsed = JSON.parse(jsonText) as unknown;
    const validated = validateExportEnvelope(parsed);
    if (!validated.ok) return validated;

    const recipes: Recipe[] = [];
    for (const recipe of validated.envelope.recipes) {
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
      recipes.push(r);
    }
    return {
      ok: true,
      envelope: { ...validated.envelope, recipes, format: 'zip' },
    };
  }

  const text = await readAsStringAsync(uri);
  const parsed = JSON.parse(text) as unknown;
  const validated = validateExportEnvelope(parsed);
  if (!validated.ok) return validated;

  const recipes = await Promise.all(
    validated.envelope.recipes.map(async (recipe) => {
      const { materializeRecipePhotos } = await import('@/lib/export/photos');
      return materializeRecipePhotos(recipe);
    }),
  );

  return {
    ok: true,
    envelope: { ...validated.envelope, recipes, format: 'recipe.json' },
  };
}
