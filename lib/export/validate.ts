import { sanitizeRecipe } from '@/lib/recipeSanitize';
import type { RecipeExportEnvelope } from '@/types/export';
import type { Recipe } from '@/types/recipe';

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function validateExportEnvelope(
  data: unknown,
): { ok: true; envelope: RecipeExportEnvelope } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isObject(data)) {
    return { ok: false, errors: ['ไฟล์เสียหายหรือไม่ใช่ไฟล์สำรองของแอป'] };
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
  const skipped: string[] = [];
  data.recipes.forEach((item, i) => {
    const recipe = sanitizeRecipe(item);
    if (!recipe) {
      skipped.push(`สูตรลำดับ ${i + 1}: ข้าม (ข้อมูลไม่ครบ)`);
      return;
    }
    recipes.push(recipe);
  });
  if (recipes.length === 0) {
    return {
      ok: false,
      errors: skipped.length ? skipped : ['ไม่มีสูตรที่นำเข้าได้'],
    };
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
