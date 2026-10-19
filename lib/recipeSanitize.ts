import type { Recipe, RecipeIngredient, RecipeStep } from '@/types/recipe';

function sanitizeIngredient(raw: unknown, index: number): RecipeIngredient | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === 'string' ? o.name.trim() : '';
  if (!name) return null;
  const amount =
    typeof o.amount === 'number' && Number.isFinite(o.amount) ? o.amount : undefined;
  const unit = typeof o.unit === 'string' ? o.unit : undefined;
  return { name, amount, unit };
}

function sanitizeStep(raw: unknown, index: number): RecipeStep | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const text = raw.trim();
    return text ? { text } : null;
  }
  if (typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const text = typeof o.text === 'string' ? o.text.trim() : '';
  if (!text) return null;
  const timerSeconds =
    typeof o.timerSeconds === 'number' && o.timerSeconds > 0 && Number.isFinite(o.timerSeconds)
      ? Math.min(Math.round(o.timerSeconds), 24 * 60 * 60)
      : undefined;
  return { text, timerSeconds };
}

export function sanitizeRecipe(raw: unknown): Recipe | null {
  if (raw == null || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === 'string' && r.id ? r.id : null;
  const title = typeof r.title === 'string' ? r.title.trim() : '';
  if (!id || !title) return null;

  const ingredients: RecipeIngredient[] = [];
  if (Array.isArray(r.ingredients)) {
    r.ingredients.forEach((ing, i) => {
      const s = sanitizeIngredient(ing, i);
      if (s) ingredients.push(s);
    });
  }
  const steps: RecipeStep[] = [];
  if (Array.isArray(r.steps)) {
    r.steps.forEach((st, i) => {
      const s = sanitizeStep(st, i);
      if (s) steps.push(s);
    });
  }
  if (ingredients.length === 0 || steps.length === 0) return null;

  const tags = Array.isArray(r.tags)
    ? r.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    : undefined;

  const base = r as Recipe;
  return {
    ...base,
    id,
    title,
    ingredients,
    steps,
    tags,
    prepMinutes: clampMinutes(r.prepMinutes),
    cookMinutes: clampMinutes(r.cookMinutes),
    servings: clampServings(r.servings),
  };
}

function clampMinutes(v: unknown): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined;
  const n = Math.round(v);
  if (n < 0) return 0;
  if (n > 24 * 60) return 24 * 60;
  return n;
}

function clampServings(v: unknown): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined;
  const n = Math.round(v);
  if (n < 1) return 1;
  if (n > 99) return 99;
  return n;
}

export function sanitizeRecipes(list: unknown[]): Recipe[] {
  const out: Recipe[] = [];
  for (const item of list) {
    const s = sanitizeRecipe(item);
    if (s) out.push(s);
  }
  return out;
}
