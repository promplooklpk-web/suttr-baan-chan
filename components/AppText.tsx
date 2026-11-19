import { Text, type TextProps, StyleSheet } from 'react-native';

import { fonts } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';

type Variant =
  | 'body'
  | 'caption'
  | 'micro'
  | 'title'
  | 'display'
  | 'heading'
  | 'label'
  | 'cardTitle';

type AppTextProps = TextProps & {
  variant?: Variant;
  muted?: boolean;
  bold?: boolean;
  accent?: boolean;
};

const variantStyles = StyleSheet.create({
  display: { fontSize: 28, lineHeight: 40, fontFamily: fonts.display },
  heading: { fontSize: 26, lineHeight: 36, fontFamily: fonts.display },
  title: { fontSize: 22, lineHeight: 31, fontFamily: fonts.display },
  cardTitle: { fontSize: 15, lineHeight: 21, fontFamily: fonts.displayMedium },
  body: { fontSize: 14, lineHeight: 20, fontFamily: fonts.regular },
  label: { fontSize: 14, lineHeight: 20, fontFamily: fonts.displayMedium },
  caption: { fontSize: 12, lineHeight: 17, fontFamily: fonts.regular },
  micro: { fontSize: 11, lineHeight: 16, fontFamily: fonts.regular },
});

export function AppText({
  variant = 'body',
  muted,
  bold,
  accent,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const color = accent
    ? colors.orange
    : muted
      ? colors.inkMuted
      : colors.ink;
  return (
    <Text
      style={[
        variantStyles[variant],
        { color },
        bold && { fontFamily: fonts.semiBold },
        style,
      ]}
      {...rest}
    />
  );
}