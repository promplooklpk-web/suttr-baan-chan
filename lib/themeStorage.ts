import { Platform } from 'react-native';
import {
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_FILE = 'theme.json';
/** Web export / Playwright screenshots (Expo web has no documentDirectory file IO). */
export const WEB_THEME_STORAGE_KEY = 'baan-chan-theme.json';

function themePath(): string {
  if (!documentDirectory) {
    throw new Error('ไม่พบโฟลเดอร์เอกสารของแอป');
  }
  return `${documentDirectory}${THEME_FILE}`;
}

function readWebPreference(): ThemePreference | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(WEB_THEME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { preference?: ThemePreference };
    if (parsed.preference === 'light' || parsed.preference === 'dark' || parsed.preference === 'system') {
      return parsed.preference;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeWebPreference(preference: ThemePreference): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(WEB_THEME_STORAGE_KEY, JSON.stringify({ preference }));
}

/** Web: read saved preference before first paint (screenshots + persisted user choice). */
export function readThemePreferenceSync(): ThemePreference | null {
  if (Platform.OS === 'web') return readWebPreference();
  return null;
}

export async function loadThemePreference(): Promise<ThemePreference> {
  if (Platform.OS === 'web') {
    const web = readWebPreference();
    if (web) return web;
    return 'dark';
  }

  try {
    const path = themePath();
    const info = await getInfoAsync(path);
    if (!info.exists) return 'dark';
    const raw = await readAsStringAsync(path);
    const parsed = JSON.parse(raw) as { preference?: ThemePreference };
    if (parsed.preference === 'light' || parsed.preference === 'dark' || parsed.preference === 'system') {
      return parsed.preference;
    }
    return 'dark';
  } catch {
    return 'dark';
  }
}

export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  if (Platform.OS === 'web') {
    writeWebPreference(preference);
    return;
  }
  const path = themePath();
  await writeAsStringAsync(path, JSON.stringify({ preference }, null, 2));
}