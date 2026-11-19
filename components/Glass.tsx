import { BlurView, type BlurTint } from 'expo-blur';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export type GlassVariant = 'chrome' | 'material' | 'card';

type GlassProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  variant?: GlassVariant;
  intensity?: number;
  /** Bottom sheet: round top corners only */
  sheet?: boolean;
  pointerEvents?: 'box-none' | 'none' | 'auto';
};

function blurTintFor(variant: GlassVariant, isDark: boolean): BlurTint {
  if (variant === 'chrome') {
    return isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight';
  }
  return isDark ? 'systemMaterialDark' : 'systemMaterialLight';
}

function defaultIntensity(variant: GlassVariant): number {
  if (variant === 'chrome') return Platform.OS === 'ios' ? 68 : 78;
  return Platform.OS === 'ios' ? 64 : 74;
}

export function Glass({
  children,
  style,
  borderRadius = radius.card,
  variant = 'material',
  intensity,
  sheet = false,
  pointerEvents = 'auto',
}: GlassProps) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const br = sheet
    ? { borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
  : { borderRadius };
  const resolvedIntensity = intensity ?? defaultIntensity(variant);
  const tint = blurTintFor(variant, isDark);
  const useBlur = Platform.OS === 'ios' || Platform.OS === 'web';

  return (
    <View
      style={[styles.shadow, { shadowColor: colors.shadow }, style]}
      pointerEvents={pointerEvents}
    >
      <View style={[styles.hairline, { borderColor: colors.glassHairline }, br]}>
        <View style={[styles.topHighlight, { borderTopColor: colors.glassBorder }, br]}>
          {useBlur ? (
            <BlurView intensity={resolvedIntensity} tint={tint} style={[styles.blur, br]}>
              <View
                style={[styles.tintOverlay, { backgroundColor: colors.glassTint }, br]}
                pointerEvents="none"
              />
              <View style={styles.content}>{children}</View>
            </BlurView>
          ) : (
            <View style={[styles.androidFill, { backgroundColor: colors.glassAndroidBg }, br]}>
              <View style={styles.content}>{children}</View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    shadow: {
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 6,
    },
    hairline: {
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    topHighlight: {
      borderTopWidth: 1,
      overflow: 'hidden',
    },
    blur: {
      overflow: 'hidden',
    },
    tintOverlay: {
      ...StyleSheet.absoluteFill,
    },
    androidFill: {
      overflow: 'hidden',
    },
    content: {},
  });