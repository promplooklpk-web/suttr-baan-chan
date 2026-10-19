import { parseAmountInput } from '@/lib/amountParse';

describe('parseAmountInput', () => {
  it('parses decimals', () => {
    expect(parseAmountInput('1.5')).toBe(1.5);
    expect(parseAmountInput('0.25')).toBe(0.25);
  });

  it('parses comma decimals', () => {
    expect(parseAmountInput('1,5')).toBe(1.5);
  });

  it('parses simple fractions', () => {
    expect(parseAmountInput('1/2')).toBe(0.5);
  });

  it('returns undefined for junk', () => {
    expect(parseAmountInput('abc')).toBeUndefined();
    expect(parseAmountInput('')).toBeUndefined();
  });
});
