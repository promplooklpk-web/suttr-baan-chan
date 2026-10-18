import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { formatTimerSeconds } from '@/lib/format';

type StepTimerChipProps = {
  timerSeconds: number;
  onComplete?: () => void;
};

export function StepTimerChip({ timerSeconds, onComplete }: StepTimerChipProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [remaining, setRemaining] = useState<number | null>(null);
  const active = remaining !== null;

  useEffect(() => {
    if (remaining === null || remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r === null || r <= 0) return 0;
        if (r === 1) onComplete?.();
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [remaining, onComplete]);

  const display = remaining !== null ? remaining : timerSeconds;
  const label = active && remaining === 0 ? 'หมดเวลา' : formatTimerSeconds(display);

  return (
    <Pressable
      onPress={() => {
        if (remaining === null) setRemaining(timerSeconds);
        else if (remaining === 0) setRemaining(timerSeconds);
      }}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityLabel={`ตั้งเวลา ${formatTimerSeconds(timerSeconds)}`}
    >
      <AppText variant="caption" style={styles.chipText}>
        {active ? '⏱ ' : ''}{label}
      </AppText>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.orange,
  },
  chipActive: {
    backgroundColor: colors.surface2,
  },
  chipText: {
    color: colors.orange,
    fontFamily: fonts.semiBold,
  },
});
