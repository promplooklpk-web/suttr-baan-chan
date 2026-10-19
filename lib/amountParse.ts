/** Parse user-entered ingredient amounts (decimals, comma, simple fractions). */
export function parseAmountInput(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  if (t.includes('/')) {
    const [left, right] = t.split('/');
    const num = Number(left.trim().replace(',', '.'));
    const den = Number(right.trim().replace(',', '.'));
    if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) {
      return num / den;
    }
    return undefined;
  }
  const normalized = t.replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : undefined;
}

export function formatAmountForField(amount?: number): string {
  if (amount == null || Number.isNaN(amount)) return '';
  return String(amount);
}
