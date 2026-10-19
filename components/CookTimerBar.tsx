import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useCookTimers } from '@/context/CookTimerContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { formatTimerSeconds } from '@/lib/format';

function remaining(timer: { endAt: number; pausedRemaining?: number }): number {
  if (timer.pausedRemaining != null) return timer.pausedRemaining;
  if (!timer.endAt) return 0;
  return Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
}

export function CookTimerBar() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { timers } = useCookTimers();
  const [, tick] = useState(0);

  useEffect(() => {
    if (timers.length === 0) return;
    const id = setInterval(() => tick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [timers.length]);

  if (timers.length === 0) return null;

  return (
    <View style={[styles.wrap, { top: insets.top + spacing.sm }]}>
      {timers.map((t) => (
        <View key={t.id} style={styles.chip}>
          <AppText variant="caption" style={styles.chipText} numberOfLines={1}>
            ⏱ {t.label} · {formatTimerSeconds(remaining(t))}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export function CookTimerBarSpacer() {
  const { timers } = useCookTimers();
  if (timers.length === 0) return null;
  return <View style={{ height: 44 }} />;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      zIndex: 30,
      gap: spacing.xs,
    },
    chip: {
      backgroundColor: colors.surface2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.orange,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      minHeight: 44,
      justifyContent: 'center',
    },
    chipText: {
      color: colors.orange,
      fontFamily: fonts.semiBold,
      fontSize: 15,
    },
  });
