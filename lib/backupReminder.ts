import { loadAppSettings, saveAppSettings, type AppSettings } from '@/lib/appSettings';
import { daysBetweenLocal, todayLocalIso } from '@/utils/localDate';

export async function recordBackupNow(): Promise<AppSettings> {
  const today = todayLocalIso();
  return saveAppSettings({ lastBackupAtIso: `${today}T12:00:00.000Z` });
}

export function shouldShowBackupNudge(
  settings: AppSettings,
  now = new Date(),
): boolean {
  if (!settings.backupNudgeEnabled) return false;
  const today = todayLocalIso(now);
  if (settings.backupNudgeSnoozeUntilIso && today <= settings.backupNudgeSnoozeUntilIso) {
    return false;
  }
  const firstOpen = settings.firstOpenDateIso ?? today;
  if (!settings.lastBackupAtIso) {
    const daysSinceInstall = daysBetweenLocal(firstOpen, today);
    return daysSinceInstall >= settings.backupNudgeDays;
  }
  const backupDay = settings.lastBackupAtIso.slice(0, 10);
  const days = daysBetweenLocal(backupDay, today);
  return days >= settings.backupNudgeDays;
}

export async function ensureFirstOpenRecorded(): Promise<void> {
  const s = await loadAppSettings();
  if (!s.firstOpenDateIso) {
    await saveAppSettings({ firstOpenDateIso: todayLocalIso() });
  }
}

export async function snoozeBackupNudgeDays(days = 7): Promise<void> {
  const until = todayLocalIso();
  const d = new Date();
  d.setDate(d.getDate() + days);
  const untilIso = todayLocalIso(d);
  await saveAppSettings({ backupNudgeSnoozeUntilIso: untilIso });
}

export async function loadBackupNudgeVisible(): Promise<boolean> {
  await ensureFirstOpenRecorded();
  const settings = await loadAppSettings();
  return shouldShowBackupNudge(settings);
}
