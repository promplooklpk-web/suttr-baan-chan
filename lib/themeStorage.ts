import {
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_FILE = 'theme.json';

function themePath(): string {
  if (!documentDirectory) {
    throw new Error('ไม่พบโฟลเดอร์เอกสารของแอป');
  }
  return `${documentDirectory}${THEME_FILE}`;
}

export async function loadThemePreference(): Promise<ThemePreference> {
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
  const path = themePath();
  await writeAsStringAsync(path, JSON.stringify({ preference }, null, 2));
}
