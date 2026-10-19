import { Platform } from 'react-native';

import type { FridgeItem } from '@/types/fridge';
import { daysUntilExpiry } from '@/lib/fridgeStatus';
import { loadAppSettings } from '@/lib/appSettings';

const DAILY_ID = 'expiry-daily-09';

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
  const Notifications = await import('expo-notifications');
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const within = items.filter((i) => {
    const d = daysUntilExpiry(i.expiresAt);
    return d != null && d >= 0 && d <= settings.expiryReminderDays;
  });
  const names = within.slice(0, 5).map((i) => i.name).join(', ');
  const body =
    within.length === 0
      ? 'ไม่มีของใกล้หมดอายุในช่วงที่ตั้งไว้'
      : `ใกล้หมดอายุ ${within.length} รายการ: ${names}${within.length > 5 ? '…' : ''}`;

  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: {
      title: 'ของในตู้เย็นใกล้หมดอายุ',
      body,
      data: { screen: 'fridge-expiring' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });
}

export async function cancelExpiryReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelScheduledNotificationAsync(DAILY_ID);
  } catch {
    /* ignore */
  }
}
