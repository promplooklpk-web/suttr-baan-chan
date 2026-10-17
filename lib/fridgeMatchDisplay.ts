import { colors } from '@/constants/theme';

export function fridgeProgressColor(percent: number): string {
  if (percent >= 100) return colors.cardGreen;
  if (percent >= 50) return colors.orange;
  return colors.cardYellow;
}

export function formatMissingIngredients(missing: string[]): string {
  if (missing.length === 0) return 'มีครบทุกอย่างแล้ว';
  const head = missing.slice(0, 2);
  const extra = missing.length - head.length;
  let line = `ขาด: ${head.join(', ')}`;
  if (extra > 0) line += ` +${extra}`;
  return line;
}
