import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';

type Props = {
  direction: 'up' | 'down';
  onStep: () => void;
};

const REPEAT_MS = 80;

export function StepperButton({ direction, onStep }: Props) {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const startRepeat = useCallback(() => {
    stop();
    timer.current = setInterval(onStep, REPEAT_MS);
  }, [onStep, stop]);

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

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
