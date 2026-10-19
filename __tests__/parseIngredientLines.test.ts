import { parseIngredientLines } from '@/lib/parseIngredientLines';

describe('parseIngredientLines', () => {
  it('parses name amount unit lines', () => {
    const rows = parseIngredientLines('ไข่ไก่ 2 ฟอง\nหมูสับ 300 กรัม');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: 'ไข่ไก่', amount: 2, unit: 'ฟอง' });
    expect(rows[1]).toMatchObject({ name: 'หมูสับ', amount: 300, unit: 'กรัม' });
  });

  it('strips bullets and skips empty lines', () => {
    const rows = parseIngredientLines('- นมสด 1 ลิตร\n\n');
    expect(rows).toEqual([{ name: 'นมสด', amount: 1, unit: 'ลิตร' }]);
  });

  it('parses name-first with unit at end', () => {
    const rows = parseIngredientLines('กะเพรา 1 กำ');
    expect(rows[0]).toMatchObject({ name: 'กะเพรา', amount: 1, unit: 'กำ' });
  });
});
