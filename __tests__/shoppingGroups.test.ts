import {
  SHOPPING_GROUP_ORDER,
  shoppingGroupForName,
} from '@/lib/shoppingGroups';

describe('shoppingGroups', () => {
  it('classifies common Thai ingredient names', () => {
    expect(shoppingGroupForName('หมูสับ')).toBe('meat');
    expect(shoppingGroupForName('กะเพรา')).toBe('veg');
    expect(shoppingGroupForName('น้ำตาลทราย')).toBe('pantry');
    expect(shoppingGroupForName('ถุงดำ')).toBe('other');
  });

  it('has stable group order', () => {
    expect(SHOPPING_GROUP_ORDER[0]).toBe('meat');
    expect(SHOPPING_GROUP_ORDER).toHaveLength(4);
  });
});
