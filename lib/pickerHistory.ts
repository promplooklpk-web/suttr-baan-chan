import {
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

const FILE = 'picker-history.json';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export type PickerHistoryStore = Record<string, string>;

function path(): string {
  if (!documentDirectory) throw new Error('no document dir');
  return `${documentDirectory}${FILE}`;
}

export async function loadPickerHistory(): Promise<PickerHistoryStore> {
  const p = path();
  const info = await getInfoAsync(p);
  if (!info.exists) return {};
  try {
    return JSON.parse(await readAsStringAsync(p)) as PickerHistoryStore;
  } catch {
    return {};
  }
}

export async function recordPickerPick(recipeId: string): Promise<void> {
  const history = await loadPickerHistory();
  history[recipeId] = new Date().toISOString();
  await writeAsStringAsync(path(), JSON.stringify(history));
}

export function wasPickedWithinDays(
  recipeId: string,
  history: PickerHistoryStore,
  withinMs = THREE_DAYS_MS,
): boolean {
  const last = history[recipeId];
  if (!last) return false;
  return Date.now() - new Date(last).getTime() < withinMs;
}

export function preferFreshPool<T extends { id: string }>(
  pool: T[],
  history: PickerHistoryStore,
): T[] {
  const fresh = pool.filter((r) => !wasPickedWithinDays(r.id, history));
  return fresh.length > 0 ? fresh : pool;
}

export function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}
