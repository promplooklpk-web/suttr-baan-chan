import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

type Props = {
  /** Stronger fade for hero cards */
  variant?: 'card' | 'hero';
};

export function PhotoGradientOverlay({ variant = 'card' }: Props) {
  const { colors, isDark } = useTheme();
  if (!isDark) {
    return (
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,42,32,0.12)' }]}
      />
    );
  }

  const bottomHeight = variant === 'hero' ? '62%' : '48%';

  return (
    <>
      <View
        pointerEvents="none"
        style={[styles.topFade, { backgroundColor: colors.overlayTop }]}
      />
      <View
        pointerEvents="none"
        style={[styles.bottomFade, { height: bottomHeight, backgroundColor: colors.overlayBottom }]}
      />
      <View
        pointerEvents="none"
        style={[styles.bottomDeep, { backgroundColor: colors.overlayDeep }]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  topFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '28%',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomDeep: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '22%',
  },
});
