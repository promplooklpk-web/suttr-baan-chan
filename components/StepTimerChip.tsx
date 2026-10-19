import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { formatTimerSeconds } from '@/lib/format';
import { useCookTimers } from '@/context/CookTimerContext';

type StepTimerChipProps = {
  timerSeconds: number;
  timerKey: string;
  timerLabel?: string;
  autoStart?: boolean;
  onComplete?: () => void;
};

export function StepTimerChip({
  timerSeconds,
  timerKey,
  timerLabel = 'ตัวจับเวลา',
  autoStart = false,
  onComplete,
}: StepTimerChipProps) {
  const styles = useThemedStyles(createStyles);
  const {
    getTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    remainingSeconds,
  } = useCookTimers();

  const timer = getTimer(timerKey);
  const remaining = timer ? remainingSeconds(timerKey) : timerSeconds;
  const running = Boolean(timer && !timer.finished && timer.endAt > 0 && timer.pausedRemaining == null);
  const paused = Boolean(timer && timer.pausedRemaining != null && !timer.finished);
  const finished = Boolean(timer?.finished);
  const autoStarted = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    autoStarted.current = false;
  }, [timerKey, timerSeconds]);

  useEffect(() => {
    if (!autoStart || autoStarted.current || timerSeconds <= 0) return;
    if (!getTimer(timerKey)) {
      autoStarted.current = true;
      startTimer(timerKey, timerLabel, timerSeconds);
    }
  }, [autoStart, timerKey, timerSeconds, timerLabel, getTimer, startTimer]);

  useEffect(() => {
    if (finished) onCompleteRef.current?.();
  }, [finished]);

  const toggle = useCallback(() => {
    if (finished) return;
    if (running) {
      pauseTimer(timerKey);
      return;
    }
    if (paused) {
      resumeTimer(timerKey);
      return;
    }
    startTimer(timerKey, timerLabel, timerSeconds);
  }, [finished, running, paused, timerKey, timerLabel, timerSeconds, startTimer, pauseTimer, resumeTimer]);

  const onLongPress = useCallback(() => {
    resetTimer(timerKey, timerSeconds);
  }, [resetTimer, timerKey, timerSeconds]);

  const label = finished
    ? 'หมดเวลา'
    : running || paused
      ? formatTimerSeconds(remaining)
      : formatTimerSeconds(timerSeconds);

  return (
    <Pressable
      onPress={toggle}
      onLongPress={onLongPress}
      style={[styles.chip, (running || paused) && styles.chipActive]}
      accessibilityLabel={`ตั้งเวลา ${formatTimerSeconds(timerSeconds)}`}
    >
      <AppText variant="caption" style={styles.chipText}>
        {running || paused || finished ? '⏱ ' : ''}{label}
        {running ? ' · แตะหยุด' : paused ? ' · แตะต่อ' : ''}
      </AppText>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
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
