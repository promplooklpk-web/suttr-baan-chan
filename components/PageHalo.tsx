import { StyleSheet, View } from 'react-native';

import type { ThemeColors } from '@/constants/colorSchemes';
import { useThemedStyles } from '@/hooks/useThemedStyles';

/** Soft orange ambient glow behind screen content (dark design boards). */
export function PageHalo() {
  const styles = useThemedStyles(createStyles);
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      ...StyleSheet.absoluteFill,
      overflow: 'hidden',
    },
    glowTop: {
      position: 'absolute',
      top: -120,
      left: '10%',
      width: '80%',
      height: 280,
      borderRadius: 200,
      backgroundColor: colors.orange,
      opacity: 0.14,
      transform: [{ scaleX: 1.2 }],
    },
    glowBottom: {
      position: 'absolute',
      bottom: 40,
      right: -40,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: colors.orange,
      opacity: 0.08,
    },
  });
