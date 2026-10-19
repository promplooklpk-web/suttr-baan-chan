import {
  deleteAsync,
  getInfoAsync,
  moveAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

import { emitFeedback } from '@/lib/feedbackBus';

export type JsonReadSource = 'main' | 'backup';

export type JsonReadResult<T> =
  | { ok: true; data: T; source: JsonReadSource }
  | { ok: false; corrupt: true };

async function quarantineCorrupt(path: string): Promise<void> {
  const corruptPath = `${path}.corrupt`;
  try {
    await deleteAsync(corruptPath, { idempotent: true });
  } catch {
    /* ignore */
  }
  try {
    await moveAsync({ from: path, to: corruptPath });
  } catch {
    /* ignore */
  }
}

export async function readJsonFileResult<T>(path: string): Promise<JsonReadResult<T>> {
  const info = await getInfoAsync(path);
  if (!info.exists) {
    return { ok: false, corrupt: true }; // missing file — treat as no data (caller checks exists)
  }
  const bakPath = `${path}.bak`;
  try {
    const raw = await readAsStringAsync(path);
    return { ok: true, data: JSON.parse(raw) as T, source: 'main' };
  } catch {
    const bakInfo = await getInfoAsync(bakPath);
    if (bakInfo.exists) {
      try {
        const raw = await readAsStringAsync(bakPath);
        return { ok: true, data: JSON.parse(raw) as T, source: 'backup' };
      } catch {
        /* fall through */
      }
    }
    await quarantineCorrupt(path);
    return { ok: false, corrupt: true };
  }
}

export async function readJsonFile<T>(
  path: string,
  fallback: T,
  onCorrupt?: (error: unknown) => void,
): Promise<T> {
  const info = await getInfoAsync(path);
  if (!info.exists) return fallback;
  const result = await readJsonFileResult<T>(path);
  if (result.ok) {
    if (result.source === 'backup') {
      emitFeedback('กู้คืนข้อมูลจากไฟล์สำรอง (.bak) แล้ว');
    }
    return result.data;
  }
  onCorrupt?.(new Error('corrupt'));
  emitFeedback(
    'ไฟล์ข้อมูลเสียหายและไม่มีสำรอง — เก็บไฟล์เดิมเป็น .corrupt แล้ว',
    { error: true },
  );
  return fallback;
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
  try {
    await deleteAsync(path, { idempotent: true });
  } catch {
    /* ignore */
  }
  try {
    await moveAsync({ from: tmp, to: path });
  } catch {
    await writeAsStringAsync(path, text);
    try {
      await deleteAsync(tmp, { idempotent: true });
    } catch {
      /* ignore */
    }
  }
}
