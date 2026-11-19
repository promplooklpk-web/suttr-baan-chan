import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type SecondaryButtonProps = PressableProps & {
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function SecondaryButton({ label, style, ...rest }: SecondaryButtonProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable style={({ pressed }) => [styles.wrap, pressed && styles.pressed, style]} {...rest}>
      <AppText style={styles.label}>{label}</AppText>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      minHeight: 52,
      borderRadius: 999,
      paddingVertical: 14,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    pressed: { opacity: 0.9 },
    label: {
      fontFamily: fonts.displayMedium,
      fontSize: 16,
      color: colors.ink,
    },
  });