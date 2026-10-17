import {
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { flattenStyle } from '@/lib/flattenStyle';

type LinkPressableProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
};

/**
 * Pressable safe to use as the direct child of expo-router `<Link asChild>`.
 * Flattens array styles so Slot does not throw at runtime.
 */
export function LinkPressable({ style, ...rest }: LinkPressableProps) {
  const resolved =
    typeof style === 'function'
      ? (state: PressableStateCallbackType) =>
          flattenStyle(style(state) as StyleProp<ViewStyle>)
      : flattenStyle(style);

  return <Pressable style={resolved} {...rest} />;
}
