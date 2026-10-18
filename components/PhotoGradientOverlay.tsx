import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

type Props = {
  /** Stronger fade for hero cards */
  variant?: 'card' | 'hero';
};

export function PhotoGradientOverlay({ variant = 'card' }: Props) {
  const { colors, isDark } = useTheme();
  if (!isDark) {
    return (
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,42,32,0.12)' }]}
      />
    );
  }

  const [r, g, b] = parseRgb(colors.overlayBottom);
  const topAlpha = parseAlpha(colors.overlayTop);
  const deepAlpha = parseAlpha(colors.overlayDeep);
  const fadeStart = variant === 'hero' ? 0.38 : 0.52;
  const bands = Array.from({ length: BAND_COUNT }, (_, i) => {
    const y = (i + 0.5) / BAND_COUNT;
    const aTop = y < TOP_FADE_END ? topAlpha * (1 - y / TOP_FADE_END) : 0;
    const aBottom = y > fadeStart ? deepAlpha * ((y - fadeStart) / (1 - fadeStart)) : 0;
    const alpha = 1 - (1 - aTop) * (1 - aBottom);
    return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
  });

  // Stepped gradient made of many thin bands (no expo-linear-gradient dependency);
  // the previous 3 flat bands produced visible hard seams on photos.
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bands.map((backgroundColor, i) => (
        <View key={i} style={{ flex: 1, backgroundColor }} />
      ))}
    </View>
  );
}

const BAND_COUNT = 40;
const TOP_FADE_END = 0.28;

function parseRgb(color: string): [number, number, number] {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [14, 13, 12];
}

function parseAlpha(color: string): number {
  const m = color.match(/,\s*([\d.]+)\)$/);
  return m ? Number(m[1]) : 1;
}
