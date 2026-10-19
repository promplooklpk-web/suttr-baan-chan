import { documentDirectory, getInfoAsync } from 'expo-file-system/legacy';

import cleanExport from '@/assets/seed/clean-recipes.json';
import { readJsonFile, writeJsonFileAtomic } from '@/lib/jsonFile';
import { webSeedEnabled } from '@/lib/webSeed';
import {
  addWeeksLocal,
  buildWeekDayIsos,
  localDateToIso,
  parseLocalDateIso,
  startOfWeekMondayLocal,
  todayLocalIso,
  weekStartIsoForDate,
} from '@/utils/localDate';
import type { MealPlanDay, MealPlanStore, MealSlot } from '@/types/mealPlan';

const FILE = 'meal-plan.json';

type MealPlanFileV2 = {
  version: 2;
  currentWeekStart: string;
  weeks: Record<string, MealPlanDay[]>;
};

function path(): string {
  if (!documentDirectory) throw new Error('no document dir');
  return `${documentDirectory}${FILE}`;
}

export function buildWeekDays(anchor: Date | string = new Date()): MealPlanDay[] {
  const isos = buildWeekDayIsos(anchor);
  return isos.map((date) => ({ date, meals: {} }));
}

function emptyWeeks(weekStart: string): MealPlanDay[] {
  return buildWeekDays(weekStart);
}

function toStoreView(file: MealPlanFileV2): MealPlanStore {
  const days = file.weeks[file.currentWeekStart] ?? emptyWeeks(file.currentWeekStart);
  return { weekStart: file.currentWeekStart, days };
}

function migrateV1(raw: MealPlanStore): MealPlanFileV2 {
  const weekStart = raw.weekStart || raw.days[0]?.date || todayLocalIso();
  const normalizedStart = weekStartIsoForDate(weekStart);
  return {
    version: 2,
    currentWeekStart: normalizedStart,
    weeks: { [normalizedStart]: raw.days.length ? raw.days : emptyWeeks(normalizedStart) },
  };
}

async function loadFile(): Promise<MealPlanFileV2> {
  if (webSeedEnabled()) {
    const ids = (cleanExport as { recipes: { id: string }[] }).recipes.map((r) => r.id);
    const days = buildWeekDays();
    days.forEach((d, i) => {
      d.meals = { breakfast: ids[i % ids.length], lunch: ids[(i + 3) % ids.length] };
      if (i % 2 === 0 && i > 0) d.meals.dinner = ids[(i + 5) % ids.length];
      if (i === 0) d.done = { breakfast: true };
    });
    const weekStart = days[0].date;
    return { version: 2, currentWeekStart: weekStart, weeks: { [weekStart]: days } };
  }

  const p = path();
  const info = await getInfoAsync(p);
  if (!info.exists) {
    const days = buildWeekDays();
    const weekStart = days[0].date;
    return { version: 2, currentWeekStart: weekStart, weeks: { [weekStart]: days } };
  }

  const raw = await readJsonFile<MealPlanStore | MealPlanFileV2>(p, {
    weekStart: todayLocalIso(),
    days: buildWeekDays(),
  });

  if (raw && typeof raw === 'object' && (raw as MealPlanFileV2).version === 2) {
    const file = raw as MealPlanFileV2;
    if (!file.weeks) file.weeks = {};
    if (!file.currentWeekStart) {
      file.currentWeekStart = todayLocalIso();
    }
    file.currentWeekStart = weekStartIsoForDate(file.currentWeekStart);
    if (!file.weeks[file.currentWeekStart]) {
      file.weeks[file.currentWeekStart] = emptyWeeks(file.currentWeekStart);
    }
    return file;
  }

  const migrated = migrateV1(raw as MealPlanStore);
  await writeJsonFileAtomic(p, migrated);
  return migrated;
}

async function saveFile(file: MealPlanFileV2): Promise<void> {
  await writeJsonFileAtomic(path(), file);
}

export async function loadMealPlan(): Promise<MealPlanStore> {
  const file = await loadFile();
  return toStoreView(file);
}

export async function loadAllMealPlanDays(): Promise<MealPlanDay[]> {
  const file = await loadFile();
  const map = new Map<string, MealPlanDay>();
  for (const days of Object.values(file.weeks)) {
    for (const d of days) {
      map.set(d.date, d);
    }
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function saveMealPlan(store: MealPlanStore): Promise<void> {
  const file = await loadFile();
  file.currentWeekStart = store.weekStart;
  file.weeks[store.weekStart] = store.days;
  await saveFile(file);
}

function updateDayInWeek(
  days: MealPlanDay[],
  date: string,
  updater: (d: MealPlanDay) => MealPlanDay,
): MealPlanDay[] {
  const found = days.some((d) => d.date === date);
  if (!found) {
    return [...days, updater({ date, meals: {} })].sort((a, b) => a.date.localeCompare(b.date));
  }
  return days.map((d) => (d.date === date ? updater(d) : d));
}

export async function setMealForDate(
  date: string,
  slot: MealSlot,
  recipeId: string | undefined,
): Promise<MealPlanStore> {
  const file = await loadFile();
  const weekKey = weekStartIsoForDate(date);
  const days = file.weeks[weekKey] ?? emptyWeeks(weekKey);
  const nextDays = updateDayInWeek(days, date, (d) => {
    const meals = { ...d.meals };
    const done = { ...(d.done ?? {}) };
    if (recipeId) meals[slot] = recipeId;
    else {
      delete meals[slot];
      delete done[slot];
    }
    return { ...d, meals, done };
  });
  file.weeks[weekKey] = nextDays;
  await saveFile(file);
  return toStoreView(file);
}

export async function toggleMealDone(
  date: string,
  slot: MealSlot,
  done?: boolean,
): Promise<MealPlanStore> {
  const file = await loadFile();
  const weekKey = weekStartIsoForDate(date);
  const days = file.weeks[weekKey] ?? emptyWeeks(weekKey);
  const nextDays = updateDayInWeek(days, date, (d) => {
    if (!d.meals[slot]) return d;
    const nextDone = { ...(d.done ?? {}) };
    const value = done ?? !nextDone[slot];
    if (value) nextDone[slot] = true;
    else delete nextDone[slot];
    return { ...d, done: nextDone };
  });
  file.weeks[weekKey] = nextDays;
  await saveFile(file);
  return toStoreView({ ...file, currentWeekStart: file.currentWeekStart });
}

export async function shiftMealPlanWeek(offsetWeeks: number): Promise<MealPlanStore> {
  const file = await loadFile();
  const newStart = addWeeksLocal(file.currentWeekStart, offsetWeeks);
  if (!file.weeks[newStart]) {
    file.weeks[newStart] = emptyWeeks(newStart);
  }
  file.currentWeekStart = newStart;
  await saveFile(file);
  return toStoreView(file);
}

/** Exposed for tests */
export function weekStartFromAnchor(anchor: Date): string {
  return localDateToIso(startOfWeekMondayLocal(anchor));
}
