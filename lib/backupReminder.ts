import { loadAppSettings, saveAppSettings, type AppSettings } from '@/lib/appSettings';
import { daysBetweenLocal, todayLocalIso } from '@/utils/localDate';

export async function recordBackupNow(): Promise<AppSettings> {
  return saveAppSettings({ lastBackupAtIso: new Date().toISOString() });
}

export function shouldShowBackupNudge(
  settings: AppSettings,
  now = new Date(),
): boolean {
  if (!settings.backupNudgeEnabled) return false;
  if (!settings.lastBackupAtIso) return true;
  const today = todayLocalIso(now);
  const backupDay = settings.lastBackupAtIso.slice(0, 10);
  const days = daysBetweenLocal(backupDay, today);
  return days >= settings.backupNudgeDays;
}

export async function loadBackupNudgeVisible(): Promise<boolean> {
  const settings = await loadAppSettings();
  return shouldShowBackupNudge(settings);
}
