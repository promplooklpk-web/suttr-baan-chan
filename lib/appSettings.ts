import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'app-settings-v1';

export type AppSettings = {
  dailyKcalGoal: number;
  expiryRemindersEnabled: boolean;
  expiryReminderDays: number;
  backupReminderShown: boolean;
  cookAutoStartTimers: boolean;
};

const DEFAULTS: AppSettings = {
  dailyKcalGoal: 1800,
  expiryRemindersEnabled: false,
  expiryReminderDays: 3,
  backupReminderShown: false,
  cookAutoStartTimers: false,
};

export async function loadAppSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveAppSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await loadAppSettings();
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
