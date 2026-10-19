import {
  readAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import JSZip from 'jszip';

import { validateExportEnvelope } from '@/lib/export/validate';
import type { RecipeExportEnvelope } from '@/types/export';
import type { Recipe } from '@/types/recipe';

export type ParsedImport =
  | { ok: true; envelope: RecipeExportEnvelope; zip: JSZip | null; zipUri: string | null }
  | { ok: false; errors: string[] };

export async function parseImportFile(
  uri: string,
  mimeType?: string | null,
  name?: string | null,
): Promise<ParsedImport> {
  const lowerName = (name ?? uri).toLowerCase();
  const isZip = lowerName.endsWith('.zip') || mimeType?.includes('zip');

  if (isZip) {
    const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
    const zip = await JSZip.loadAsync(base64, { base64: true });
    const recipesFile = zip.file('recipes.json');
    if (!recipesFile) {
      return { ok: false, errors: ['ไม่พบ recipes.json ในไฟล์ zip'] };
    }
    let jsonText: string;
    try {
      jsonText = await recipesFile.async('string');
    } catch {
      return { ok: false, errors: ['ไฟล์เสียหายหรือไม่ใช่ไฟล์สำรองของแอป'] };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return { ok: false, errors: ['ไฟล์เสียหายหรือไม่ใช่ไฟล์สำรองของแอป'] };
    }
    const validated = validateExportEnvelope(parsed);
    if (!validated.ok) return validated;

    const recipes: Recipe[] = validated.envelope.recipes.map((r) => JSON.parse(JSON.stringify(r)));
    return {
      ok: true,
      envelope: { ...validated.envelope, recipes, format: 'zip' },
      zip,
      zipUri: uri,
    };
  }

  let text: string;
  try {
    text = await readAsStringAsync(uri);
  } catch {
    return { ok: false, errors: ['อ่านไฟล์ไม่สำเร็จ'] };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['ไฟล์เสียหายหรือไม่ใช่ไฟล์สำรองของแอป'] };
  }
  const validated = validateExportEnvelope(parsed);
  if (!validated.ok) return validated;

  return {
    ok: true,
    envelope: { ...validated.envelope, format: 'recipe.json' },
    zip: null,
    zipUri: null,
  };
}
