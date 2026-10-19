import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { formatTimerSeconds } from '@/lib/format';
import { scheduleCookTimerNotification } from '@/lib/cookTimerNotify';

type StepTimerChipProps = {
  timerSeconds: number;
  /** Unique per step so state resets when the step changes */
  timerKey: string;
  onComplete?: () => void;
};

function remainingFromEnd(endAt: number): number {
  return Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
}

export function StepTimerChip({ timerSeconds, timerKey, onComplete }: StepTimerChipProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [endAt, setEndAt] = useState<number | null>(null);
  const [pausedRemaining, setPausedRemaining] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setEndAt(null);
    setPausedRemaining(null);
    completedRef.current = false;
  }, [timerKey, timerSeconds]);

  const running = endAt != null;
  const displayRemaining =
    running && endAt != null
      ? remainingFromEnd(endAt)
      : pausedRemaining ?? timerSeconds;

  useEffect(() => {
    if (!running || endAt == null) return;
    const id = setInterval(() => {
      setTick((t) => t + 1);
      const left = remainingFromEnd(endAt);
      if (left <= 0 && !completedRef.current) {
        completedRef.current = true;
        setEndAt(null);
        setPausedRemaining(0);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        onCompleteRef.current?.();
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, endAt]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', () => setTick((t) => t + 1));
    return () => sub.remove();
  }, []);

  const toggle = useCallback(() => {
    if (displayRemaining === 0 && !running) {
      completedRef.current = false;
      setPausedRemaining(timerSeconds);
      return;
    }
    if (running && endAt != null) {
      setPausedRemaining(remainingFromEnd(endAt));
      setEndAt(null);
      return;
    }
    const base = pausedRemaining ?? timerSeconds;
    if (base <= 0) {
      completedRef.current = false;
      setPausedRemaining(timerSeconds);
      return;
    }
    const nextEnd = Date.now() + base * 1000;
    setEndAt(nextEnd);
    setPausedRemaining(null);
    completedRef.current = false;
    scheduleCookTimerNotification(timerKey, base).catch(() => undefined);
  }, [displayRemaining, running, endAt, pausedRemaining, timerSeconds, timerKey]);

  const reset = useCallback(() => {
    setEndAt(null);
    setPausedRemaining(null);
    completedRef.current = false;
  }, []);

  const label =
    displayRemaining === 0 && !running ? 'หมดเวลา' : formatTimerSeconds(displayRemaining);

  return (
    <Pressable
      onPress={toggle}
      onLongPress={reset}
      style={[styles.chip, running && styles.chipActive]}
      accessibilityLabel={`ตั้งเวลา ${formatTimerSeconds(timerSeconds)}`}
    >
      <AppText variant="caption" style={styles.chipText}>
        {running || pausedRemaining != null ? '⏱ ' : ''}{label}
        {running ? ' · แตะหยุด' : pausedRemaining != null && pausedRemaining > 0 ? ' · แตะต่อ' : ''}
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
