import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type Props = {
  direction: 'up' | 'down';
  onStep: () => void;
};

const REPEAT_MS = 80;

export function StepperButton({ direction, onStep }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  const startRepeat = useCallback(() => {
    stop();
    timer.current = setInterval(() => onStepRef.current(), REPEAT_MS);
  }, [stop]);

  return (
    <Pressable
      style={styles.btn}
      onPress={onStep}
      onLongPress={startRepeat}
      onPressOut={stop}
      delayLongPress={280}
    >
      <Ionicons
        name={direction === 'up' ? 'add' : 'remove'}
        size={22}
        color={colors.ink}
      />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
