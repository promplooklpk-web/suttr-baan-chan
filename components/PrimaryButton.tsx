import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { accentGlow } from '@/lib/design';

type PrimaryButtonProps = PressableProps & {
  label: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export function PrimaryButton({ label, style, compact, ...rest }: PrimaryButtonProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  return (
    <Pressable style={[styles.wrap, accentGlow(colors, true), style]} {...rest}>
      <AppText style={[styles.label, compact && styles.labelCompact]}>{label}</AppText>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: colors.orange,
      borderRadius: 999,
      paddingVertical: 16,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      color: colors.onAccent,
      fontFamily: fonts.semiBold,
      fontSize: 17,
    },
    labelCompact: {
      fontSize: 15,
    },
  });
