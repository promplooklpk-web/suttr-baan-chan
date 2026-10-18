import { StyleSheet, View, type ViewProps } from 'react-native';

import { PageHalo } from '@/components/PageHalo';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export function ScreenShell({ style, children, ...rest }: ViewProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.screen, style]} {...rest}>
      <PageHalo />
      {children}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.cream,
    },
  });
