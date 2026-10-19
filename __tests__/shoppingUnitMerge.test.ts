import { addAmounts, mergeItemKey } from '@/lib/shoppingUnitMerge';

describe('shoppingUnitMerge', () => {
  it('merges g and kg under same key', () => {
    expect(mergeItemKey('น้ำตาล', 'กรัม')).toBe(mergeItemKey('น้ำตาล', 'กก.'));
  });

  it('adds g and kg amounts', () => {
    const merged = addAmounts(500, 'กรัม', 1, 'กก.');
    expect(merged).toEqual({ amount: 1500, unit: 'กรัม' });
  });
});
