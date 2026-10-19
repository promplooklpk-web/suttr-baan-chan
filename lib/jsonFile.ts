import {
  deleteAsync,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

export async function readJsonFile<T>(
  path: string,
  fallback: T,
  onCorrupt?: (error: unknown) => void,
): Promise<T> {
  const info = await getInfoAsync(path);
  if (!info.exists) return fallback;
  const bakPath = `${path}.bak`;
  try {
    const raw = await readAsStringAsync(path);
    return JSON.parse(raw) as T;
  } catch (error) {
    onCorrupt?.(error);
    const bakInfo = await getInfoAsync(bakPath);
    if (bakInfo.exists) {
      try {
        const raw = await readAsStringAsync(bakPath);
        return JSON.parse(raw) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

export async function writeJsonFileAtomic(path: string, data: unknown): Promise<void> {
  const text = JSON.stringify(data, null, 2);
  const tmp = `${path}.tmp`;
  const bak = `${path}.bak`;
  await writeAsStringAsync(tmp, text);
  const info = await getInfoAsync(path);
  if (info.exists) {
    try {
      await deleteAsync(bak, { idempotent: true });
    } catch {
      /* ignore */
    }
    try {
      const prev = await readAsStringAsync(path);
      await writeAsStringAsync(bak, prev);
    } catch {
      /* ignore */
    }
  }
  await writeAsStringAsync(path, text);
  try {
    await deleteAsync(tmp, { idempotent: true });
  } catch {
    /* ignore */
  }
}
