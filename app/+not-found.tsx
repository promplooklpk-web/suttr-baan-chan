import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/PrimaryButton';
import { spacing, radius } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { ScreenShell } from '@/components/ScreenShell';

export default function NotFoundScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  return (
    <ScreenShell>
      <Stack.Screen options={{ title: 'ไม่พบหน้า' }} />
      <View style={styles.container}>
        <View style={[styles.rings, { borderColor: colors.surface2 }]}>
          <View style={[styles.ringMid, { backgroundColor: colors.surface2 }]}>
            <Ionicons name="search-outline" size={32} color={colors.inkMuted} />
          </View>
        </View>
        <AppText variant="title">ไม่พบหน้านี้</AppText>
        <AppText variant="body" muted style={styles.sub}>
          ลิงก์อาจหมดอายุหรือพิมพ์ผิด
        </AppText>
        <Link href="/" asChild>
          <PrimaryButton label="กลับหน้าแรก" style={styles.btn} />
        </Link>
      </View>
    </ScreenShell>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    rings: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    ringMid: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sub: { marginTop: spacing.sm, textAlign: 'center' },
    btn: { marginTop: spacing.lg, minWidth: 200 },
  });