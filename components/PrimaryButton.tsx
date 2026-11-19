import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  icon?: keyof typeof Ionicons.glyphMap;
};

export function PrimaryButton({ label, style, compact, icon, ...rest }: PrimaryButtonProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.wrap,
        accentGlow(colors, true),
        pressed && styles.pressed,
        style,
      ]}
      {...rest}
    >
      <View style={styles.inner}>
        {icon ? (
          <Ionicons name={icon} size={18} color={colors.onAccent} style={styles.icon} />
        ) : null}
        <AppText style={[styles.label, compact && styles.labelCompact]} suppressHighlighting>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      borderRadius: 999,
      backgroundColor: colors.orange,
      overflow: 'hidden',
    },
    inner: {
      minHeight: 52,
      paddingVertical: 14,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.92 },
    icon: { marginRight: 8 },
    label: {
      color: colors.onAccent,
      fontFamily: fonts.displayMedium,
      fontSize: 16,
    },
    labelCompact: { fontSize: 14 },
  });