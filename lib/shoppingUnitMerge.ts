/** Normalize units for merging shopping amounts (g↔kg, ml↔l). */

export type UnitFamily = 'mass' | 'volume' | 'count' | 'other';

const MASS_G = new Set(['g', 'กรัม', 'gram', 'grams']);
const MASS_KG = new Set(['kg', 'กก.', 'กิโลกรัม', 'kilogram']);
const VOL_ML = new Set(['ml', 'มล.', 'milliliter']);
const VOL_L = new Set(['l', 'ลิตร', 'liter', 'litre']);

export function unitFamily(unit?: string): UnitFamily {
  const u = (unit ?? '').trim().toLowerCase();
  if (!u) return 'other';
  if (MASS_G.has(u) || MASS_KG.has(u)) return 'mass';
  if (VOL_ML.has(u) || VOL_L.has(u)) return 'volume';
  if (/^(ฟอง|ชิ้น|หัว|กำ|เม็ด|กลีบ|ต้น|ซอง|แพ็ค|ถ้วย|ช้อนโต๊ะ|ช้อนชา)$/.test(u)) return 'count';
  return 'other';
}

/** Convert amount to base unit (g or ml) when possible; otherwise return as-is. */
export function toBaseAmount(amount: number, unit?: string): { amount: number; baseUnit: string } | null {
  const u = (unit ?? '').trim();
  const lower = u.toLowerCase();
  if (MASS_G.has(lower) || u === 'กรัม') return { amount, baseUnit: 'g' };
  if (MASS_KG.has(lower) || u === 'กก.') return { amount: amount * 1000, baseUnit: 'g' };
  if (VOL_ML.has(lower) || u === 'มล.') return { amount, baseUnit: 'ml' };
  if (VOL_L.has(lower) || u === 'ลิตร') return { amount: amount * 1000, baseUnit: 'ml' };
  return null;
}

export function fromBaseAmount(baseAmount: number, baseUnit: 'g' | 'ml'): { amount: number; unit: string } {
  if (baseUnit === 'g') {
    if (baseAmount >= 1000 && baseAmount % 1000 === 0) {
      return { amount: baseAmount / 1000, unit: 'กก.' };
    }
    return { amount: baseAmount, unit: 'กรัม' };
  }
  if (baseAmount >= 1000 && baseAmount % 1000 === 0) {
    return { amount: baseAmount / 1000, unit: 'ลิตร' };
  }
  return { amount: baseAmount, unit: 'มล.' };
}

export function mergeItemKey(name: string, unit?: string): string {
  const family = unitFamily(unit);
  const base = toBaseAmount(1, unit);
  if (base) {
    return `${name.trim().toLowerCase()}|${base.baseUnit}`;
  }
  if (family === 'count') {
    return `${name.trim().toLowerCase()}|count`;
  }
  return `${name.trim().toLowerCase()}|${(unit ?? '').trim().toLowerCase()}`;
}

export function addAmounts(
  a: number | undefined,
  unitA: string | undefined,
  b: number | undefined,
  unitB: string | undefined,
): { amount?: number; unit?: string } {
  if (a == null && b == null) return {};
  if (a == null) return { amount: b, unit: unitB };
  if (b == null) return { amount: a, unit: unitA };
  const baseA = toBaseAmount(a, unitA);
  const baseB = toBaseAmount(b, unitB);
  if (baseA && baseB && baseA.baseUnit === baseB.baseUnit) {
    const total = baseA.amount + baseB.amount;
    const out = fromBaseAmount(total, baseA.baseUnit as 'g' | 'ml');
    return out;
  }
  if ((unitA ?? '') === (unitB ?? '')) {
    return { amount: a + b, unit: unitA ?? unitB };
  }
  return { amount: a, unit: unitA };
}
