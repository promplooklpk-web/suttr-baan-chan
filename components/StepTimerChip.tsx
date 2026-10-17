import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { formatTimerSeconds } from '@/lib/format';

type StepTimerChipProps = {
  timerSeconds: number;
};

export function StepTimerChip({ timerSeconds }: StepTimerChipProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const active = remaining !== null;

  useEffect(() => {
    if (remaining === null || remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((r) => (r !== null && r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [remaining]);

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

const styles = StyleSheet.create({
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
    backgroundColor: '#FFE8D6',
  },
  chipText: {
    color: colors.orange,
    fontFamily: fonts.semiBold,
  },
});
