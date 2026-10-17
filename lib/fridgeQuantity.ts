import type { FridgeItem } from '@/types/fridge';

export const FRIDGE_UNIT_OPTIONS = [
  'กรัม',
  'กก.',
  'มล.',
  'ลิตร',
  'ช้อนโต๊ะ',
  'ฟอง',
  'ฝัก',
  'หัว',
  'กำ',
  'ซอง',
  'แพ็ค',
  'ผล',
  'ชิ้น',
] as const;

export type UnitKind = 'mass_g' | 'mass_kg' | 'volume_ml' | 'volume_l' | 'piece' | 'other';

const GRAM_ALIASES = new Set(['ก.', 'ก', 'กรัม', 'g', 'gram', 'grams']);
const KG_ALIASES = new Set(['กก.', 'kg', 'กิโลกรัม']);
const ML_ALIASES = new Set(['มล.', 'ml', 'มิลลิลิตร']);
const L_ALIASES = new Set(['ลิตร', 'l', 'L']);
const PIECE_ALIASES = new Set([
  'ฟอง',
  'ฝัก',
  'หัว',
  'กำ',
  'ซอง',
  'แพ็ค',
  'ผล',
  'ชิ้น',
  'ช้อนโต๊ะ',
  'ช้อนชา',
  'ถ้วย',
]);

export function unitKind(unit: string): UnitKind {
  const u = unit.trim();
  if (GRAM_ALIASES.has(u)) return 'mass_g';
  if (KG_ALIASES.has(u)) return 'mass_kg';
  if (ML_ALIASES.has(u)) return 'volume_ml';
  if (L_ALIASES.has(u)) return 'volume_l';
  if (PIECE_ALIASES.has(u)) return 'piece';
  return 'other';
}

export function stepForUnit(unit: string): number {
  const kind = unitKind(unit);
  switch (kind) {
    case 'mass_g':
      return 50;
    case 'mass_kg':
      return 0.5;
    case 'volume_ml':
      return 50;
    case 'volume_l':
      return 0.1;
    case 'piece':
      return 1;
    default:
      return 1;
  }
}

export function quickAmountsForUnit(unit: string): number[] {
  const kind = unitKind(unit);
  switch (kind) {
    case 'mass_g':
      return [100, 250, 500, 1000];
    case 'mass_kg':
      return [0.5, 1, 2];
    case 'volume_ml':
      return [100, 250, 500, 1000];
    case 'volume_l':
      return [0.5, 1, 2];
    case 'piece':
      return [1, 2, 6, 12];
    default:
      return [1, 2, 5, 10];
  }
}

export function formatQuantityLabel(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(parseFloat(n.toFixed(2)));
}

export function parseQuantityInput(text: string): number | null {
  const t = text.replace(/,/g, '').trim();
  if (!t) return null;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

export function usageSubtractAmount(item: FridgeItem, preset: 'half' | 'quarter' | 'all'): number {
  if (preset === 'all') return item.quantity;
  if (preset === 'half') return item.quantity / 2;
  return item.quantity / 4;
}

export function usagePresetLabel(item: FridgeItem, preset: 'half' | 'quarter' | 'all'): string {
  const amt = usageSubtractAmount(item, preset);
  const u = item.unit;
  if (preset === 'all') return `ใช้หมด (${formatQuantityLabel(item.quantity)} ${u})`;
  if (preset === 'half') return `ใช้ครึ่ง (${formatQuantityLabel(amt)} ${u})`;
  return `ใช้ 1/4 (${formatQuantityLabel(amt)} ${u})`;
}
