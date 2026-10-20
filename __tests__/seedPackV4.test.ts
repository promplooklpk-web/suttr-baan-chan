import cleanExport from '@/assets/seed/clean-recipes.json';
import onedishExport from '@/assets/seed/onedish/recipes.json';
import { SEED_PACK_V3_RECIPE_IDS } from '@/lib/seedPackV3Ids';
import { CURRENT_SEED_VERSION, isBundledSeedRecipeId } from '@/lib/seedVersion';

const MAIN_INGREDIENT_KEYWORDS = [
  'ไข่',
  'อกไก่',
  'ไก่',
  'หมู',
  'หมูสับ',
  'เนื้อสับ',
  'บรอกโคลี',
];

function recipeUsesMainIngredient(recipe: {
  title: string;
  ingredients: { name: string }[];
}): boolean {
  const hay = `${recipe.title} ${recipe.ingredients.map((i) => i.name).join(' ')}`;
  return MAIN_INGREDIENT_KEYWORDS.some((k) => hay.includes(k));
}

describe('seed pack v4 (weight-loss)', () => {
  const clean = (cleanExport as { recipes: unknown[] }).recipes;
  const onedish = (onedishExport as { recipes: unknown[] }).recipes;

  it('ships 20 bundled recipes (10 clean + 10 onedish)', () => {
    expect(clean).toHaveLength(10);
    expect(onedish).toHaveLength(10);
    expect(CURRENT_SEED_VERSION).toBe(4);
  });

  it('uses new ids not present in seed pack v3', () => {
    for (const r of [...clean, ...onedish] as { id: string }[]) {
      expect(SEED_PACK_V3_RECIPE_IDS.has(r.id)).toBe(false);
      expect(isBundledSeedRecipeId(r.id)).toBe(true);
    }
    expect(SEED_PACK_V3_RECIPE_IDS.size).toBe(20);
  });

  it('tags weight-loss and uses allowed main proteins', () => {
    const all = [...clean, ...onedish] as {
      tags?: string[];
      title: string;
      ingredients: { name: string }[];
      steps: { text: string }[];
      servings?: number;
      notes?: string;
      photo?: { path?: string };
    }[];
    expect(all).toHaveLength(20);
    for (const r of all) {
      expect(r.tags).toContain('ลดน้ำหนัก');
      expect(recipeUsesMainIngredient(r)).toBe(true);
      expect(r.ingredients.length).toBeGreaterThanOrEqual(4);
      expect(r.steps.length).toBeGreaterThanOrEqual(2);
      expect(r.servings).toBeGreaterThanOrEqual(1);
      expect(r.notes).toMatch(/กิโลแคลอรี/);
      expect(r.photo?.path).toMatch(/^images\//);
    }
    const broccoliCount = all.filter((r) =>
      `${r.title} ${r.ingredients.map((i) => i.name).join(' ')}`.includes('บรอกโคลี'),
    ).length;
    expect(broccoliCount).toBeGreaterThanOrEqual(5);
  });
});
