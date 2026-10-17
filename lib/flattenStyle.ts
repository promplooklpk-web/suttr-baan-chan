import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

/** Flatten style for expo-router Link `asChild` children (Slot rejects array `style`). */
export function flattenStyle(style: StyleProp<ViewStyle> | undefined): ViewStyle | undefined {
  if (style == null) return undefined;
  return StyleSheet.flatten(style) as ViewStyle;
}
