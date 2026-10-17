import {
  cacheDirectory,
  documentDirectory,
  readAsStringAsync,
  writeAsStringAsync,
  EncodingType,
  getInfoAsync,
} from 'expo-file-system/legacy';

import { FRIDGE_FILE } from '@/lib/fridgeStorage';
import { createExportZip } from '@/lib/export/exportZip';

const EXTRA_FILES = ['meal-plan.json', 'shopping-list.json', FRIDGE_FILE];

/** Full app backup: recipes zip contents + meal plan + shopping + fridge. */
export async function createFullBackupZip(recipes: import('@/types/recipe').Recipe[]): Promise<string> {
  const recipeOnlyPath = await createExportZip(recipes);
  if (!cacheDirectory || !documentDirectory) {
    throw new Error('ไม่พบโฟลเดอร์ไฟล์');
  }

  const JSZip = (await import('jszip')).default;
  const base64 = await readAsStringAsync(recipeOnlyPath, { encoding: EncodingType.Base64 });
  const zip = await JSZip.loadAsync(base64, { base64: true });

  for (const file of EXTRA_FILES) {
    const full = `${documentDirectory}${file}`;
    const info = await getInfoAsync(full);
    if (info.exists) {
      const text = await readAsStringAsync(full);
      zip.file(file, text);
    }
  }

  const outB64 = await zip.generateAsync({ type: 'base64' });
  const outPath = `${cacheDirectory}suttr-backup-${Date.now()}.zip`;
  await writeAsStringAsync(outPath, outB64, { encoding: EncodingType.Base64 });
  return outPath;
}

import type JSZip from 'jszip';

export async function restoreExtraBackupFiles(zip: JSZip): Promise<void> {
  if (!documentDirectory) return;
  for (const file of EXTRA_FILES) {
    const entry = zip.file(file);
    if (!entry) continue;
    const text = await entry.async('string');
    await writeAsStringAsync(`${documentDirectory}${file}`, text);
  }
}
