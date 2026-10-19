import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { spacing } from '@/constants/theme';
import { ScreenShell } from '@/components/ScreenShell';

export default function NotFoundScreen() {
  return (
    <ScreenShell>
      <Stack.Screen options={{ title: 'ไม่พบหน้า' }} />
      <View style={styles.container}>
        <AppText variant="title">ไม่พบหน้านี้</AppText>
        <AppText variant="body" muted style={styles.sub}>
          ลิงก์อาจหมดอายุหรือพิมพ์ผิด
        </AppText>
        <Link href="/" style={styles.link}>
          <AppText style={styles.linkText}>กลับหน้าแรก</AppText>
        </Link>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sub: { marginTop: spacing.sm, textAlign: 'center' },
  link: { marginTop: spacing.lg, paddingVertical: spacing.md },
  linkText: { color: '#E0601F', fontSize: 16 },
});
