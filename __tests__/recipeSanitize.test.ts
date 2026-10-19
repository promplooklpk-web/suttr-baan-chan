import { sanitizeRecipe } from '@/lib/recipeSanitize';

describe('sanitizeRecipe', () => {
  it('skips null ingredients and string-only steps', () => {
    const r = sanitizeRecipe({
      id: 'x',
      title: 'ทดสอบ',
      ingredients: [null, { name: 'ไข่', amount: 1 }],
      steps: ['ขั้นตอนเดียว', { text: 'ขั้นสอง' }],
      createdAt: '',
      updatedAt: '',
    });
    expect(r?.ingredients).toHaveLength(1);
    expect(r?.steps).toHaveLength(2);
    expect(r?.steps[0].text).toBe('ขั้นตอนเดียว');
  });

  it('rejects recipe with no valid ingredients', () => {
    expect(
      sanitizeRecipe({
        id: 'x',
        title: 'ทดสอบ',
        ingredients: [null],
        steps: [{ text: 'a' }],
      }),
    ).toBeNull();
  });
});
