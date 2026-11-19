import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/Glass';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  absolute?: boolean;
  onLayout?: (e: { nativeEvent: { layout: { height: number } } }) => void;
};

export function GlassBottomBar({ children, style, absolute = true, onLayout }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();

  const bar = (
    <Glass variant="material" sheet style={[styles.bar, { paddingBottom: insets.bottom + spacing.md }, style]}>
      <View style={[styles.sheetTint, { backgroundColor: tokens.sheetFill }]} pointerEvents="none" />
      <View style={styles.content}>{children}</View>
    </Glass>
  );

  if (!absolute) return <View onLayout={onLayout}>{bar}</View>;

  return (
    <View style={styles.anchor} onLayout={onLayout}>
      {bar}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.gutter,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sheetTint: {
    ...StyleSheet.absoluteFill,
    borderTopLeftRadius: 0,
  },
  content: {},
});