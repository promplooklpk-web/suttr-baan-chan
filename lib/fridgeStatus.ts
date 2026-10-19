import type { FridgeItem, FridgeStatus } from '@/types/fridge';
import { parseLocalDateIso, todayLocalIso } from '@/utils/localDate';

export function daysUntilExpiry(expiresAt?: string, now = new Date()): number | null {
  if (!expiresAt) return null;
  const exp = parseLocalDateIso(expiresAt.slice(0, 10));
  const today = parseLocalDateIso(todayLocalIso(now));
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

export function statusPillLabel(item: FridgeItem): string {
  const daysLeft = daysUntilExpiry(item.expiresAt);
  if (daysLeft != null && daysLeft < 0) return 'หมดอายุแล้ว';
  if (daysLeft === 0) return 'วันนี้';
  if (daysLeft === 1) return 'พรุ่งนี้';
  if (daysLeft != null && daysLeft > 1) return `อีก ${daysLeft} วัน`;
  return 'ปกติ';
}

export function formatExpiryLine(item: FridgeItem): string {
  const status = fridgeItemStatus(item);
  if (!item.expiresAt) return status.label;
  const d = parseLocalDateIso(item.expiresAt.slice(0, 10));
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
