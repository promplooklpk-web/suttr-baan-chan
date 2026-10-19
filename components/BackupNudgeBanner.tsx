import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { loadAppSettings, saveAppSettings } from '@/lib/appSettings';
import { shouldShowBackupNudge } from '@/lib/backupReminder';

type Props = {
  onExportPress: () => void;
};

export function BackupNudgeBanner({ onExportPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  const refresh = useCallback(() => {
    loadAppSettings().then((s) => setVisible(shouldShowBackupNudge(s)));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!visible) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-upload-outline" size={22} color={colors.orange} />
      <View style={styles.textCol}>
        <AppText variant="label">ยังไม่ได้สำรองข้อมูลนานแล้ว</AppText>
        <AppText variant="caption" muted>แนะนำส่งออกไฟล์ .zip อย่างน้อยทุก 7 วัน</AppText>
      </View>
      <Pressable style={styles.cta} onPress={onExportPress}>
        <AppText variant="caption" style={styles.ctaText}>ส่งออก</AppText>
      </Pressable>
      <Pressable
        hitSlop={12}
        onPress={async () => {
          await saveAppSettings({ backupNudgeEnabled: false });
          setVisible(false);
        }}
        accessibilityLabel="ปิดการเตือนสำรอง"
      >
        <Ionicons name="close" size={20} color={colors.inkMuted} />
      </Pressable>
    </View>
  );
}

export function useRefreshBackupNudge(): () => void {
  const [, setTick] = useState(0);
  return useCallback(() => setTick((t) => t + 1), []);
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textCol: { flex: 1, gap: 2 },
    cta: {
      minHeight: 36,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.orange,
      justifyContent: 'center',
    },
    ctaText: { color: colors.onAccent, fontFamily: fonts.semiBold },
  });
