import { filterPlanDaysFromToday, generateShoppingItems } from '@/lib/shoppingList';
import type { MealPlanDay } from '@/types/mealPlan';
import type { Recipe } from '@/types/recipe';

const recipe: Recipe = {
  id: 'r1',
  title: 'ทดสอบ',
  ingredients: [
    { name: 'ไข่ไก่', amount: 3, unit: 'ฟอง' },
    { name: 'น้ำปลา', amount: 1, unit: 'ช้อนโต๊ะ' },
  ],
  steps: [{ text: 'ทำ' }],
  createdAt: '',
  updatedAt: '',
};

describe('filterPlanDaysFromToday', () => {
  it('drops past plan days', () => {
    const days: MealPlanDay[] = [
      { date: '2026-10-10', meals: { lunch: 'r1' } },
      { date: '2026-10-19', meals: { lunch: 'r1' } },
    ];
    const filtered = filterPlanDaysFromToday(days, '2026-10-19');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].date).toBe('2026-10-19');
  });
});

describe('generateShoppingItems', () => {
  it('subtracts fridge stock for matching name+unit', () => {
    const days: MealPlanDay[] = [{ date: '2026-10-19', meals: { lunch: 'r1' } }];
    const byId = new Map([['r1', recipe]]);
    const items = generateShoppingItems(days, byId, [
      {
        id: 'f1',
        name: 'ไข่ไก่',
        quantity: 2,
        unit: 'ฟอง',
        place: 'chilled',
        addedAt: '',
        updatedAt: '',
      },
    ]);
    const eggs = items.find((i) => i.name === 'ไข่ไก่');
    expect(eggs?.amount).toBe(1);
  });

  it('merges same ingredient across recipes', () => {
    const days: MealPlanDay[] = [
      { date: '2026-10-19', meals: { lunch: 'r1', dinner: 'r1' } },
    ];
    const items = generateShoppingItems(days, new Map([['r1', recipe]]), []);
    const eggs = items.find((i) => i.name === 'ไข่ไก่');
    expect(eggs?.amount).toBe(6);
  });
});
