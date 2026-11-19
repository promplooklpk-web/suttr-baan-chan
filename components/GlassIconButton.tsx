import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Glass } from '@/components/Glass';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  accent?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: number;
};

export function GlassIconButton({
  icon,
  onPress,
  accessibilityLabel,
  accent,
  style,
  size = 40,
}: Props) {
  const { colors, tokens } = useTheme();
  const iconColor = accent ? tokens.accentText : colors.ink;

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={({ pressed }) => [pressed && styles.pressed, style]}
    >
      <Glass
        variant="chrome"
        borderRadius={size / 2}
        intensity={72}
        style={{ width: size, height: size, shadowOpacity: 0.06, elevation: 2 }}
      >
        <View style={[styles.hit, { width: size, height: size }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
      </Glass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
});