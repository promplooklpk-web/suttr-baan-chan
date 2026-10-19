import { shouldShowBackupNudge } from '@/lib/backupReminder';
import type { AppSettings } from '@/lib/appSettings';

const base: AppSettings = {
  dailyKcalGoal: 1800,
  expiryRemindersEnabled: false,
  expiryReminderDays: 3,
  backupReminderShown: false,
  cookAutoStartTimers: false,
  backupNudgeEnabled: true,
  backupNudgeDays: 7,
};

describe('shouldShowBackupNudge', () => {
  it('shows when never backed up', () => {
    expect(shouldShowBackupNudge({ ...base, lastBackupAtIso: undefined })).toBe(true);
  });

  it('hides when disabled', () => {
    expect(
      shouldShowBackupNudge({ ...base, backupNudgeEnabled: false, lastBackupAtIso: undefined }),
    ).toBe(false);
  });

  it('shows when last backup older than threshold', () => {
    const now = new Date('2026-10-19T12:00:00+07:00');
    expect(
      shouldShowBackupNudge({ ...base, lastBackupAtIso: '2026-10-01T10:00:00.000Z' }, now),
    ).toBe(true);
  });

  it('hides when recent backup', () => {
    const now = new Date('2026-10-19T12:00:00+07:00');
    expect(
      shouldShowBackupNudge({ ...base, lastBackupAtIso: '2026-10-18T10:00:00.000Z' }, now),
    ).toBe(false);
  });
});
