import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { accentGlow } from '@/lib/design';

export type SegmentOption<T extends string> = {
  id: T;
  label: string;
};

type SegmentPillsProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (id: T) => void;
  scrollable?: boolean;
};

export function SegmentPills<T extends string>({
  options,
  value,
  onChange,
  scrollable,
}: SegmentPillsProps<T>) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  const content = options.map((opt) => {
    const active = opt.id === value;
    return (
      <Pressable
        key={opt.id}
        onPress={() => onChange(opt.id)}
        style={[
          styles.pill,
          active && styles.pillActive,
          active && accentGlow(colors, false),
        ]}
      >
        <AppText
          variant="label"
          style={{ color: active ? colors.onAccent : colors.inkMuted, fontSize: 14 }}
        >
          {opt.label}
        </AppText>
      </Pressable>
    );
  });

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {content}
      </ScrollView>
    );
  }

  return <View style={styles.rowWrap}>{content}</View>;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    rowWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    pill: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    pillActive: {
      backgroundColor: colors.orange,
      borderColor: colors.orange,
    },
  });
