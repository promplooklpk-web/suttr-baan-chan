import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Glass } from '@/components/Glass';
import { radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type PhotoGlassHeroProps = {
  imageSource?: ImageSource | null;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  height?: number;
  borderRadius?: number;
  panelBorderRadius?: number;
  /** left inset panel (home) vs centered card (settings/about) */
  panelLayout?: 'inset-left' | 'center';
  topRight?: React.ReactNode;
};

export function PhotoGlassHero({
  imageSource,
  children,
  style,
  height = 196,
  borderRadius = 26,
  panelBorderRadius = 20,
  panelLayout = 'inset-left',
  topRight,
}: PhotoGlassHeroProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.shell, { height, borderRadius }, style]}>
      {imageSource ? (
        <Image source={imageSource} style={styles.photo} contentFit="cover" />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]} />
      )}
      <View
        style={panelLayout === 'center' ? styles.panelCenterWrap : styles.panelLeftWrap}
        pointerEvents="box-none"
      >
        <Glass variant="card" borderRadius={panelBorderRadius} intensity={56} style={styles.panelGlass}>
          <View style={styles.panelInner}>{children}</View>
        </Glass>
      </View>
      {topRight ? <View style={styles.topRight}>{topRight}</View> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    shell: {
      overflow: 'hidden',
      position: 'relative',
      marginBottom: spacing.md,
    },
    photo: {
      ...StyleSheet.absoluteFill,
      width: '100%',
      height: '100%',
    },
    photoPlaceholder: {
      backgroundColor: colors.imagePlaceholder,
    },
    panelLeftWrap: {
      position: 'absolute',
      left: 8,
      top: 8,
      bottom: 8,
      width: '58%',
      maxWidth: 226,
    },
    panelCenterWrap: {
      position: 'absolute',
      left: 12,
      right: 12,
      top: 12,
      bottom: 12,
      alignItems: 'stretch',
      justifyContent: 'center',
    },
    panelGlass: {
      flex: 1,
    },
    panelInner: {
      flex: 1,
      padding: spacing.md,
      justifyContent: 'center',
    },
    topRight: {
      position: 'absolute',
      top: 12,
      right: 12,
    },
  });