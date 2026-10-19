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

  it('parses amount unit name (tablespoon)', () => {
    const rows = parseIngredientLines('2 ช้อนโต๊ะ น้ำมันหอย');
    expect(rows[0]).toMatchObject({ name: 'น้ำมันหอย', amount: 2, unit: 'ช้อนโต๊ะ' });
  });

  it('parses glued amount+unit', () => {
    expect(parseIngredientLines('5 เม็ด')[0]).toMatchObject({ amount: 5, unit: 'เม็ด' });
    expect(parseIngredientLines('3กลีบ')[0]).toMatchObject({ amount: 3, unit: 'กลีบ' });
  });

  it('keeps lines without amount as name-only', () => {
    expect(parseIngredientLines('หมูชิ้น')[0]).toMatchObject({ name: 'หมูชิ้น', amount: undefined });
  });
});
