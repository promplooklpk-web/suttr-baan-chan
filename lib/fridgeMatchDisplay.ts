import type { ThemeColors } from '@/constants/colorSchemes';

export function matchPercentColor(percent: number, colors: ThemeColors): string {
  if (percent >= 80) return colors.cardGreen;
  if (percent >= 50) return colors.orange;
  return colors.cardYellow;
}

export function fridgeProgressColor(percent: number, colors: ThemeColors): string {
  return matchPercentColor(percent, colors);
}

export function formatMissingIngredients(missing: string[]): string {
  if (missing.length === 0) return 'มีครบทุกอย่างแล้ว';
  const head = missing.slice(0, 2);
  const extra = missing.length - head.length;
  let line = `ขาด: ${head.join(', ')}`;
  if (extra > 0) line += ` +${extra}`;
  return line;
}
