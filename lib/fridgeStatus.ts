import type { FridgeItem, FridgeStatus } from '@/types/fridge';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function daysUntilExpiry(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  const exp = startOfDay(new Date(expiresAt));
  const today = startOfDay(new Date());
  const diff = exp.getTime() - today.getTime();
  return Math.round(diff / (24 * 60 * 60 * 1000));
}

export function fridgeItemStatus(item: FridgeItem): FridgeStatus {
  const daysLeft = daysUntilExpiry(item.expiresAt);
  if (daysLeft == null) {
    return { kind: 'none', daysLeft: null, label: 'ไม่ระบุวันหมดอายุ' };
  }
  if (daysLeft < 0) {
    return { kind: 'expired', daysLeft, label: 'หมดอายุแล้ว' };
  }
  if (daysLeft <= 3) {
    return {
      kind: 'expiring',
      daysLeft,
      label: daysLeft === 0 ? 'หมดอายุวันนี้' : `ใกล้หมดอายุ — อีก ${daysLeft} วัน`,
    };
  }
  return { kind: 'ok', daysLeft, label: 'ปกติ' };
}

export function formatExpiryLine(item: FridgeItem): string {
  const status = fridgeItemStatus(item);
  if (!item.expiresAt) return status.label;
  const d = new Date(item.expiresAt);
  const dateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  return `หมด ${dateStr} · ${status.label}`;
}

export function isFridgeItemExpired(item: FridgeItem): boolean {
  const d = daysUntilExpiry(item.expiresAt);
  return d != null && d < 0;
}

export function isFridgeItemExpiringSoon(item: FridgeItem): boolean {
  const d = daysUntilExpiry(item.expiresAt);
  return d != null && d >= 0 && d <= 3;
}

export function countAlertItems(items: FridgeItem[]): number {
  return items.filter((i) => isFridgeItemExpired(i) || isFridgeItemExpiringSoon(i)).length;
}
