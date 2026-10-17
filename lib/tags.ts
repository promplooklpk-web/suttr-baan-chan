import type { Recipe } from '@/types/recipe';

export function collectAllTags(recipes: Recipe[]): string[] {
  const set = new Set<string>();
  for (const r of recipes) {
    r.tags?.forEach((t) => {
      const trimmed = t.trim();
      if (trimmed) set.add(trimmed);
    });
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'th'));
}

export function renameTag(recipes: Recipe[], from: string, to: string): Recipe[] {
  const next = to.trim();
  if (!next) return recipes;
  return recipes.map((r) => {
    if (!r.tags?.length) return r;
    const tags = r.tags.map((t) => (t === from ? next : t));
    return { ...r, tags: [...new Set(tags)] };
  });
}

export function removeTag(recipes: Recipe[], tag: string): Recipe[] {
  return recipes.map((r) => {
    if (!r.tags?.length) return r;
    return { ...r, tags: r.tags.filter((t) => t !== tag) };
  });
}
