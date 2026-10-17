/** Normalize Thai/Latin ingredient names for fuzzy matching. */
export function normalizeIngredientName(name: string): string {
  let s = name.trim().toLowerCase();
  s = s.replace(/[()[\]{}]/g, '');
  s = s.replace(/\s+/g, '');
  s = s.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
  return s;
}

export function ingredientNamesMatch(a: string, b: string): boolean {
  const na = normalizeIngredientName(a);
  const nb = normalizeIngredientName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 2 && nb.length >= 2) {
    if (na.includes(nb) || nb.includes(na)) return true;
  }
  return false;
}
