import {
  deleteAsync,
  getInfoAsync,
  moveAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

import { emitFeedback } from '@/lib/feedbackBus';

export type JsonReadSource = 'main' | 'backup' | 'tmp';

export type JsonReadResult<T> =
  | { ok: true; data: T; source: JsonReadSource }
  | { ok: false; corrupt: true; quarantined?: boolean };

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

async function tryParseFile<T>(filePath: string): Promise<T | null> {
  const info = await getInfoAsync(filePath);
  if (!info.exists) return null;
  try {
    const raw = await readAsStringAsync(filePath);
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function recoverWhenMainMissing<T>(path: string): Promise<JsonReadResult<T> | null> {
  const tmpPath = `${path}.tmp`;
  const bakPath = `${path}.bak`;
  const fromTmp = await tryParseFile<T>(tmpPath);
  if (fromTmp != null) {
    return { ok: true, data: fromTmp, source: 'tmp' };
  }
  const fromBak = await tryParseFile<T>(bakPath);
  if (fromBak != null) {
    return { ok: true, data: fromBak, source: 'backup' };
  }
  return null;
}

export async function readJsonFileResult<T>(path: string): Promise<JsonReadResult<T>> {
  const bakPath = `${path}.bak`;
  const mainInfo = await getInfoAsync(path);
  if (!mainInfo.exists) {
    const recovered = await recoverWhenMainMissing<T>(path);
    if (recovered) return recovered;
    return { ok: false, corrupt: true };
  }
  try {
    const raw = await readAsStringAsync(path);
    return { ok: true, data: JSON.parse(raw) as T, source: 'main' };
  } catch {
    const bakInfo = await getInfoAsync(bakPath);
    if (bakInfo.exists) {
      const fromBak = await tryParseFile<T>(bakPath);
      if (fromBak != null) {
        return { ok: true, data: fromBak, source: 'backup' };
      }
    }
    await quarantineCorrupt(path);
    return { ok: false, corrupt: true, quarantined: true };
  }
}

const RECOVERY_MSG: Record<JsonReadSource, string | undefined> = {
  main: undefined,
  backup: 'กู้คืนข้อมูลจากไฟล์สำรอง (.bak) แล้ว',
  tmp: 'กู้คืนข้อมูลจากไฟล์ที่กำลังบันทึก (.tmp) แล้ว',
};

export async function readJsonFile<T>(
  path: string,
  fallback: T,
  onCorrupt?: (error: unknown) => void,
): Promise<T> {
  const result = await readJsonFileResult<T>(path);
  if (result.ok) {
    const msg = RECOVERY_MSG[result.source];
    if (msg) emitFeedback(msg);
    return result.data;
  }
  onCorrupt?.(new Error('corrupt'));
  if (result.quarantined) {
    emitFeedback(
      'ไฟล์ข้อมูลเสียหายและไม่มีสำรอง — เก็บไฟล์เดิมเป็น .corrupt แล้ว',
      { error: true },
    );
  }
  const mainInfo = await getInfoAsync(path);
  if (!mainInfo.exists) {
    const recovered = await recoverWhenMainMissing<T>(path);
    if (recovered?.ok) {
      const msg = RECOVERY_MSG[recovered.source];
      if (msg) emitFeedback(msg);
      return recovered.data;
    }
  }
  return fallback;
}

/** Atomic write: tmp → main, with previous main moved to .bak (never drop a good .bak on missing main). */
export async function writeJsonFileAtomic(path: string, data: unknown): Promise<void> {
  const text = JSON.stringify(data, null, 2);
  const tmp = `${path}.tmp`;
  const bak = `${path}.bak`;
  await writeAsStringAsync(tmp, text);
  const mainInfo = await getInfoAsync(path);
  if (mainInfo.exists) {
    try {
      await deleteAsync(bak, { idempotent: true });
    } catch {
      /* ignore */
    }
    try {
      await moveAsync({ from: path, to: bak });
    } catch {
      try {
        const prev = await readAsStringAsync(path);
        await writeAsStringAsync(bak, prev);
        await deleteAsync(path, { idempotent: true });
      } catch {
        /* ignore */
      }
    }
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
