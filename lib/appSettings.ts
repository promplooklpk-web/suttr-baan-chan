import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'app-settings-v1';

export type AppSettings = {
  dailyKcalGoal: number;
  expiryRemindersEnabled: boolean;
  expiryReminderDays: number;
  /** @deprecated one-time prompt replaced by recurring nudge */
  backupReminderShown: boolean;
  cookAutoStartTimers: boolean;
  lastBackupAtIso?: string;
  backupNudgeEnabled: boolean;
  backupNudgeDays: number;
};

const DEFAULTS: AppSettings = {
  dailyKcalGoal: 1800,
  expiryRemindersEnabled: false,
  expiryReminderDays: 3,
  backupReminderShown: false,
  cookAutoStartTimers: false,
  lastBackupAtIso: undefined,
  backupNudgeEnabled: true,
  backupNudgeDays: 7,
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
