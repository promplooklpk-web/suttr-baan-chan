import { Text, type TextProps, StyleSheet } from 'react-native';

import { colors, fonts } from '@/constants/theme';

type Variant = 'body' | 'caption' | 'title' | 'heading' | 'label';

type AppTextProps = TextProps & {
  variant?: Variant;
  muted?: boolean;
  bold?: boolean;
};

const variantStyles = StyleSheet.create({
  body: { fontSize: 16, lineHeight: 24, fontFamily: fonts.regular },
  caption: { fontSize: 13, lineHeight: 18, fontFamily: fonts.regular },
  label: { fontSize: 14, lineHeight: 20, fontFamily: fonts.medium },
  title: { fontSize: 20, lineHeight: 28, fontFamily: fonts.bold },
  heading: { fontSize: 26, lineHeight: 34, fontFamily: fonts.bold },
});

export function AppText({
  variant = 'body',
  muted,
  bold,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        variantStyles[variant],
        { color: muted ? colors.inkMuted : colors.ink },
        bold && { fontFamily: fonts.bold },
        style,
      ]}
      {...rest}
    />
  );
}
