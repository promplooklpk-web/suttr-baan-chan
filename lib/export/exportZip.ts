import {
  cacheDirectory,
  documentDirectory,
  readAsStringAsync,
  writeAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';

import { collectRecipeImagePaths } from '@/lib/seedInstall';
import type { RecipeExportEnvelope } from '@/types/export';
import type { Recipe } from '@/types/recipe';

function buildEnvelope(recipes: Recipe[]): RecipeExportEnvelope {
  return {
    schemaVersion: 1,
    app: 'baan-chan-recipes',
    exportedAt: new Date().toISOString(),
    includesPhotos: true,
    format: 'zip',
    recipes,
  };
}

export async function createExportZip(recipes: Recipe[]): Promise<string> {
  if (!cacheDirectory || !documentDirectory) {
    throw new Error('ไม่พบโฟลเดอร์ไฟล์');
  }
  const zip = new JSZip();
  const envelope = buildEnvelope(recipes);
  zip.file('recipes.json', JSON.stringify(envelope, null, 2));

  const imgFolder = zip.folder('images');
  const seen = new Set<string>();
  for (const recipe of recipes) {
    for (const rel of collectRecipeImagePaths(recipe)) {
      if (seen.has(rel)) continue;
      seen.add(rel);
      const fileName = rel.replace(/^images\//, '');
      const full = `${documentDirectory}${rel}`;
      try {
        const base64 = await readAsStringAsync(full, { encoding: EncodingType.Base64 });
        imgFolder?.file(fileName, base64, { base64: true });
      } catch {
        // skip missing image
      }
    }
  }

  const base64Zip = await zip.generateAsync({ type: 'base64' });
  const outPath = `${cacheDirectory}suttr-export-${Date.now()}.zip`;
  await writeAsStringAsync(outPath, base64Zip, { encoding: EncodingType.Base64 });
  return outPath;
}

/** @returns true when the user likely completed sharing (not dismissed). */
export async function shareExportFile(uri: string, mimeType: string): Promise<boolean> {
  const can = await Sharing.isAvailableAsync();
  if (!can) throw new Error('อุปกรณ์นี้ไม่รองรับการแชร์ไฟล์');
  const { Platform, Share } = await import('react-native');
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const result = await Share.share({
      url: uri,
      title: 'สำรองสูตรบ้านฉัน',
    });
    return result.action === Share.sharedAction;
  }
  await Sharing.shareAsync(uri, { mimeType, UTI: mimeType });
  return true;
}
