import { Platform } from 'react-native';

export async function scheduleCookTimerNotification(timerKey: string, seconds: number): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.requestPermissionsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'หมดเวลาแล้ว',
        body: 'ขั้นตอนในสูตรของคุณครบเวลาแล้ว',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, seconds),
      },
      identifier: `cook-timer-${timerKey}`,
    });
  } catch {
    /* optional in Expo Go */
  }
}
