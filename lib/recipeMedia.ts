import { photoUri } from '@/lib/storage';
import type { Recipe } from '@/types/recipe';

/** Cover image URI for list/picker UI (file path or inline base64). */
export function recipeCoverUri(recipe: Recipe): string | undefined {
  if (recipe.photo?.path) {
    return photoUri(recipe.photo.path);
  }
  if (recipe.photo?.data && recipe.photo.mime) {
    return `data:${recipe.photo.mime};base64,${recipe.photo.data}`;
  }
  return undefined;
}

export function parseRecipeCalories(recipe: Recipe): number | null {
  const text = `${recipe.caloriesEstimate ?? ''} ${recipe.notes ?? ''}`;
  const kcal = text.match(/(\d+)\s*kcal/i);
  if (kcal) return parseInt(kcal[1], 10);
  const th = text.match(/(\d+)\s*กิโลแคลอรี/);
  if (th) return parseInt(th[1], 10);
  const approx = text.match(/ประมาณ\s*(\d+)/);
  if (approx) return parseInt(approx[1], 10);
  return null;
}

export function categoryChipLabel(category?: string): string {
  if (!category) return 'ทั่วไป';
  if (category === 'อาหารจานเดียว' || category === 'จานเดียว') return 'จานเดียว';
  if (category === 'อาหารคลีน') return 'คลีน';
  return category;
}
