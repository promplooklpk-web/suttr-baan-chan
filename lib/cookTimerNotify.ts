import { Platform } from 'react-native';

export function cookTimerNotificationId(timerKey: string): string {
  return `cook-timer-${timerKey}`;
}

export async function cancelCookTimerNotification(timerKey: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelScheduledNotificationAsync(cookTimerNotificationId(timerKey));
  } catch {
    /* optional */
  }
}

export async function scheduleCookTimerNotification(timerKey: string, seconds: number): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.requestPermissionsAsync();
    await cancelCookTimerNotification(timerKey);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'หมดเวลาแล้ว',
        body: 'ขั้นตอนในสูตรของคุณครบเวลาแล้ว',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, seconds),
      },
      identifier: cookTimerNotificationId(timerKey),
    });
  } catch {
    /* optional in Expo Go */
  }
}
