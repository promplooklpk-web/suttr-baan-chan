import {
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

import cleanExport from '@/assets/seed/clean-recipes.json';
import { webSeedEnabled } from '@/lib/webSeed';
import type { MealPlanDay, MealPlanStore, MealSlot } from '@/types/mealPlan';

const FILE = 'meal-plan.json';

function path(): string {
  if (!documentDirectory) throw new Error('no document dir');
  return `${documentDirectory}${FILE}`;
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildWeekDays(anchor = new Date()): MealPlanDay[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return { date: formatDate(date), meals: {} };
  });
}

export async function loadMealPlan(): Promise<MealPlanStore> {
  if (webSeedEnabled()) {
    const ids = (cleanExport as { recipes: { id: string }[] }).recipes.map((r) => r.id);
    const days = buildWeekDays();
    days.forEach((d, i) => {
      d.meals = { breakfast: ids[i % ids.length], lunch: ids[(i + 3) % ids.length] };
      if (i % 2 === 0) d.meals.dinner = ids[(i + 5) % ids.length];
    });
    return { weekStart: days[0].date, days };
  }
  const p = path();
  const info = await getInfoAsync(p);
  if (!info.exists) {
    const days = buildWeekDays();
    return { weekStart: days[0].date, days };
  }
  const raw = JSON.parse(await readAsStringAsync(p)) as MealPlanStore;
  if (!raw.days?.length) {
    const days = buildWeekDays();
    return { weekStart: days[0].date, days };
  }
  return raw;
}

export async function saveMealPlan(store: MealPlanStore): Promise<void> {
  await writeAsStringAsync(path(), JSON.stringify(store, null, 2));
}

export async function setMealForDate(
  date: string,
  slot: MealSlot,
  recipeId: string | undefined,
): Promise<MealPlanStore> {
  const store = await loadMealPlan();
  const days = store.days.map((d) => {
    if (d.date !== date) return d;
    const meals = { ...d.meals };
    if (recipeId) meals[slot] = recipeId;
    else delete meals[slot];
    return { ...d, meals };
  });
  const next = { ...store, days };
  await saveMealPlan(next);
  return next;
}

export async function shiftMealPlanWeek(offsetWeeks: number): Promise<MealPlanStore> {
  const store = await loadMealPlan();
  const base = new Date(store.weekStart);
  base.setDate(base.getDate() + offsetWeeks * 7);
  const days = buildWeekDays(base);
  const next = { weekStart: days[0].date, days };
  await saveMealPlan(next);
  return next;
}
