import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type Segment = { value: number; color: string };

type ProgressRingProps = {
  size?: number;
  stroke?: number;
  progress?: number;
  color?: string;
  trackColor?: string;
  segments?: Segment[];
  center?: React.ReactNode;
};

export function ProgressRing({
  size = 72,
  stroke = 7,
  progress = 0.65,
  color,
  trackColor,
  segments,
  center,
}: ProgressRingProps) {
  const styles = useThemedStyles(createStyles);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  if (segments && segments.length > 0) {
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    let offset = 0;
    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={trackColor ?? styles.track.color}
            strokeWidth={stroke}
            fill="none"
          />
          {segments.map((seg, i) => {
            const len = (seg.value / total) * c;
            const dash = `${len} ${c - len}`;
            const el = (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={seg.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
            offset += len;
            return el;
          })}
        </Svg>
        <View style={styles.center}>{center}</View>
      </View>
    );
  }

  const clamped = Math.min(1, Math.max(0, progress));
  const dash = `${clamped * c} ${c}`;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor ?? styles.track.color}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? styles.fill.color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={dash}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>{center}</View>
    </View>
  );
}

export function ProgressRingLabel({
  title,
  subtitle,
  titleColor,
}: {
  title: string;
  subtitle?: string;
  titleColor?: string;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <AppText
        style={{
          fontFamily: fonts.display,
          fontSize: 18,
          lineHeight: 22,
          color: titleColor,
        }}
      >
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="micro" muted style={{ textAlign: 'center' }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    track: { color: colors.surface2 },
    fill: { color: colors.orange },
    center: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
    },
  });