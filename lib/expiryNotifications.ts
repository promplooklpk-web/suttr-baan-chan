import { Platform } from 'react-native';

import type { FridgeItem } from '@/types/fridge';
import { daysUntilExpiry } from '@/lib/fridgeStatus';
import { loadAppSettings } from '@/lib/appSettings';
import { addDaysLocal, todayLocalIso } from '@/utils/localDate';

const LEGACY_DAILY_ID = 'expiry-daily-09';
const DAILY_ID_PREFIX = 'expiry-daily-09';

export function buildExpiryNotificationBody(items: FridgeItem[], reminderDays: number): string {
  const within = items.filter((i) => {
    const d = daysUntilExpiry(i.expiresAt);
    return d != null && d >= 0 && d <= reminderDays;
  });
  const names = within.slice(0, 5).map((i) => i.name).join(', ');
  if (within.length === 0) {
    return 'ไม่มีของใกล้หมดอายุในช่วงที่ตั้งไว้';
  }
  return `ใกล้หมดอายุ ${within.length} รายการ: ${names}${within.length > 5 ? '…' : ''}`;
}

function nineAmLocal(dayIso: string): Date {
  const [y, m, d] = dayIso.split('-').map((x) => parseInt(x, 10));
  return new Date(y, m - 1, d, 9, 0, 0, 0);
}

export async function configureExpiryNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    /* ignore */
  }
}

export async function syncExpiryReminderSchedule(items: FridgeItem[]): Promise<void> {
  const settings = await loadAppSettings();
  if (Platform.OS === 'web' || !settings.expiryRemindersEnabled) {
    await cancelExpiryReminder();
    return;
  }
  try {
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const body = buildExpiryNotificationBody(items, settings.expiryReminderDays);
    const today = todayLocalIso();
    await Notifications.cancelScheduledNotificationAsync(LEGACY_DAILY_ID).catch(() => undefined);

    for (let offset = 0; offset < 7; offset += 1) {
      const day = addDaysLocal(today, offset);
      const id = `${DAILY_ID_PREFIX}-${day}`;
      const when = nineAmLocal(day);
      if (when.getTime() <= Date.now()) continue;
      await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title: 'ของในตู้เย็นใกล้หมดอายุ',
          body,
          data: { screen: 'fridge-expiring', scheduledFor: day },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
        },
      });
    }
  } catch {
    /* ignore */
  }
}

export async function cancelExpiryReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    const today = todayLocalIso();
    for (let offset = 0; offset < 7; offset += 1) {
      const day = addDaysLocal(today, offset);
      await Notifications.cancelScheduledNotificationAsync(`${DAILY_ID_PREFIX}-${day}`);
    }
    await Notifications.cancelScheduledNotificationAsync(LEGACY_DAILY_ID);
  } catch {
    /* ignore */
  }
}
