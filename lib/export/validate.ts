import type { RecipeExportEnvelope } from '@/types/export';
import type { Recipe } from '@/types/recipe';

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateRecipe(r: unknown, index: number, errors: string[]): Recipe | null {
  if (!isObject(r)) {
    errors.push(`สูตรลำดับ ${index + 1}: รูปแบบไม่ถูกต้อง`);
    return null;
  }
  if (typeof r.id !== 'string' || !r.id) {
    errors.push(`สูตรลำดับ ${index + 1}: ไม่มี id`);
    return null;
  }
  if (typeof r.title !== 'string' || !r.title.trim()) {
    errors.push(`"${String(r.title)}" (${r.id}): ไม่มีชื่อสูตร`);
    return null;
  }
  if (!Array.isArray(r.ingredients)) {
    errors.push(`"${r.title}": ไม่มีส่วนผสม`);
    return null;
  }
  if (!Array.isArray(r.steps)) {
    errors.push(`"${r.title}": ไม่มีขั้นตอน`);
    return null;
  }
  return r as Recipe;
}

export function validateExportEnvelope(
  data: unknown,
): { ok: true; envelope: RecipeExportEnvelope } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isObject(data)) {
    return { ok: false, errors: ['ไฟล์ไม่ใช่ JSON ที่ถูกต้อง'] };
  }
  if (data.schemaVersion !== 1) {
    errors.push('schemaVersion ต้องเป็น 1');
  }
  if (data.app !== 'baan-chan-recipes') {
    errors.push('app ต้องเป็น baan-chan-recipes');
  }
  if (typeof data.exportedAt !== 'string') {
    errors.push('ไม่มี exportedAt');
  }
  if (!Array.isArray(data.recipes)) {
    errors.push('ไม่มีรายการ recipes');
    return { ok: false, errors };
  }
  const recipes: Recipe[] = [];
  data.recipes.forEach((item, i) => {
    const recipe = validateRecipe(item, i, errors);
    if (recipe) recipes.push(recipe);
  });
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  const envelope: RecipeExportEnvelope = {
    schemaVersion: 1,
    app: 'baan-chan-recipes',
    exportedAt: data.exportedAt as string,
    includesPhotos: Boolean(data.includesPhotos),
    format: data.format === 'recipe.json' ? 'recipe.json' : 'zip',
    recipes,
  };
  return { ok: true, envelope };
}
