import AsyncStorage from '@react-native-async-storage/async-storage';

import { webSeedEnabled } from '@/lib/webSeed';

const KEY = 'search-recent-v1';
const MAX = 8;

const WEB_SEED_RECENT = ['ลาบไก่', 'ข้าวผัด', 'ไข่', 'สลัดอกไก่'];

export async function loadRecentSearches(): Promise<string[]> {
  if (webSeedEnabled()) return [...WEB_SEED_RECENT];
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export async function pushRecentSearch(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) return loadRecentSearches();
  const prev = await loadRecentSearches();
  const next = [q, ...prev.filter((x) => x !== q)].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function removeRecentSearch(query: string): Promise<string[]> {
  const next = (await loadRecentSearches()).filter((x) => x !== query);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
