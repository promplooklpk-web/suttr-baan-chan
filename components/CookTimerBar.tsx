import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useCookTimers } from '@/context/CookTimerContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { formatTimerSeconds } from '@/lib/format';

export function CookTimerBar() {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { timers, setBarHeight, remainingSeconds, dismissTimer } = useCookTimers();
  const [, tick] = useState(0);

  useEffect(() => {
    if (timers.length === 0) return;
    const id = setInterval(() => tick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [timers.length]);

  if (timers.length === 0) return null;

  return (
    <View
      style={[styles.wrap, { top: insets.top + spacing.sm }]}
      onLayout={(e) => setBarHeight(e.nativeEvent.layout.height)}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {timers.map((t) => {
          const left = remainingSeconds(t.id);
          const done = t.finished || left <= 0;
          return (
            <Pressable
              key={t.id}
              style={styles.chip}
              onPress={() => done && dismissTimer(t.id)}
            >
              <AppText variant="caption" style={styles.chipText} numberOfLines={1}>
                ⏱ {t.label} · {done ? 'หมดเวลา · แตะปิด' : formatTimerSeconds(left)}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function CookTimerBarSpacer() {
  const { timers, barHeight } = useCookTimers();
  if (timers.length === 0) return null;
  return <View style={{ height: Math.max(barHeight, 44) }} />;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      zIndex: 30,
      maxHeight: 52,
    },
    row: {
      gap: spacing.xs,
      alignItems: 'center',
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
