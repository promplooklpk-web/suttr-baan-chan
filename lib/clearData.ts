import { deleteAsync, documentDirectory, getInfoAsync } from 'expo-file-system/legacy';

import { initializeStorage } from '@/lib/storage';

const FILES = ['recipes.json', 'meal-plan.json', 'shopping-list.json', 'fridge.json', 'picker-history.json'];

export async function clearAllAppData(): Promise<void> {
  if (!documentDirectory) return;
  for (const file of FILES) {
    const full = `${documentDirectory}${file}`;
    const info = await getInfoAsync(full);
    if (info.exists) await deleteAsync(full, { idempotent: true });
  }
  const imagesDir = `${documentDirectory}images`;
  const imgInfo = await getInfoAsync(imagesDir);
  if (imgInfo.exists) {
    await deleteAsync(imagesDir, { idempotent: true });
  }
  await initializeStorage();
}
