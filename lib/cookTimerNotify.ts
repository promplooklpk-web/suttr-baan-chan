import { Platform } from 'react-native';

const scheduleGeneration = new Map<string, number>();

export function cookTimerNotificationId(timerKey: string): string {
  return `cook-timer-${timerKey}`;
}

export function bumpCookTimerScheduleGeneration(timerKey: string): number {
  const next = (scheduleGeneration.get(timerKey) ?? 0) + 1;
  scheduleGeneration.set(timerKey, next);
  return next;
}

export function invalidateCookTimerSchedule(timerKey: string): void {
  scheduleGeneration.delete(timerKey);
}

async function cancelCookTimerNotificationNative(timerKey: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelScheduledNotificationAsync(cookTimerNotificationId(timerKey));
  } catch {
    /* optional */
  }
}

export async function cancelCookTimerNotification(timerKey: string): Promise<void> {
  invalidateCookTimerSchedule(timerKey);
  await cancelCookTimerNotificationNative(timerKey);
}

export async function scheduleCookTimerNotification(timerKey: string, seconds: number): Promise<void> {
  if (Platform.OS === 'web') return;
  const generation = bumpCookTimerScheduleGeneration(timerKey);
  try {
    const Notifications = await import('expo-notifications');
    await cancelCookTimerNotificationNative(timerKey);
    if (scheduleGeneration.get(timerKey) !== generation) return;

    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.status === 'granted';
    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync();
      granted = requested.status === 'granted';
    }
    if (!granted || scheduleGeneration.get(timerKey) !== generation) return;

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
