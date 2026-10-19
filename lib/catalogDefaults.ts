import type { FridgePlace } from '@/types/fridge';
import {
  addDaysLocal,
  daysBetweenLocal,
  parseLocalDateIso,
  todayLocalIso,
} from '@/utils/localDate';

export function defaultQuantityForName(name: string): { quantity: number; unit: string } {
  const n = name.trim();
  if (/ไข่/.test(n)) return { quantity: 10, unit: 'ฟอง' };
  if (/นม/.test(n)) return { quantity: 1, unit: 'ลิตร' };
  if (/ข้าว/.test(n)) return { quantity: 1, unit: 'กก.' };
  if (/หมู|ไก่|เนื้อ|ปลา/.test(n)) return { quantity: 300, unit: 'กรัม' };
  if (/พริก|กะเพรา|ผัก|หอม|กระเทียม/.test(n)) return { quantity: 1, unit: 'กำ' };
  return { quantity: 1, unit: 'กรัม' };
}

export function defaultExpiryForPlace(place: FridgePlace): string | undefined {
  if (place === 'chilled') return addDaysLocal(todayLocalIso(), 3);
  if (place === 'frozen') return addDaysLocal(todayLocalIso(), 30);
  return undefined;
}

export function formatExpiryFriendly(iso?: string, now = new Date()): string {
  if (!iso) return 'ไม่ระบุวันหมดอายุ';
  const d = parseLocalDateIso(iso.slice(0, 10));
  const dateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  const days = daysBetweenLocal(todayLocalIso(now), iso.slice(0, 10));
  if (days < 0) return `${dateStr} (หมดอายุแล้ว)`;
  if (days === 0) return `${dateStr} (วันนี้)`;
  return `${dateStr} (อีก ${days} วัน)`;
}
