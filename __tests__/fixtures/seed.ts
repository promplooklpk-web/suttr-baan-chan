import type { FridgeItem } from '@/types/fridge';
import type { Recipe } from '@/types/recipe';

export const seedRecipe: Recipe = {
  id: '6da6201a-3a01-4726-aa9a-5bcfc5c8d8c7',
  title: 'ลาบไก่อกไก่ลวกไม่ใช้น้ำมัน',
  category: 'อาหารคลีน',
  tags: ['ไก่', 'อีสาน'],
  prepMinutes: 15,
  cookMinutes: 10,
  servings: 1,
  difficulty: 'easy',
  ingredients: [
    { name: 'อกไก่สับหรือบด ไม่มีหนัง', amount: 150, unit: 'กรัม' },
    { name: 'หอมแดงซอยบาง', amount: 3, unit: 'หัว' },
    { name: 'น้ำปลา', amount: 1.5, unit: 'ช้อนโต๊ะ' },
  ],
  steps: [{ text: 'ลวกไก่จนสุก' }, { text: 'คลุกเครื่องปรุง' }],
  isFavorite: true,
  photo: { path: 'images/larb-gai.jpg', mime: 'image/jpeg' },
  createdAt: '2026-10-17T00:00:00.000Z',
  updatedAt: '2026-10-17T00:00:00.000Z',
};

export const seedRecipeTwo: Recipe = {
  id: 'recipe-two-id',
  title: 'ข้าวผัดไก่',
  category: 'อาหารจานเดียว',
  prepMinutes: 10,
  cookMinutes: 15,
  servings: 2,
  difficulty: 'easy',
  ingredients: [{ name: 'ข้าวสวย', amount: 2, unit: 'ถ้วย' }],
  steps: [{ text: 'ผัด' }],
  createdAt: '2026-10-17T00:00:00.000Z',
  updatedAt: '2026-10-17T00:00:00.000Z',
};

export const seedFridgeItems: FridgeItem[] = [
  {
    id: 'fridge-1',
    name: 'อกไก่',
    quantity: 300,
    unit: 'กรัม',
    place: 'chilled',
    expiresAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fridge-2',
    name: 'หอมแดง',
    quantity: 5,
    unit: 'หัว',
    place: 'dry',
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
