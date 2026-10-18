import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { accentGlow } from '@/lib/design';

export type HomeFilterId = 'all' | 'ready' | 'quick' | 'clean';

const FILTERS: { id: HomeFilterId; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'ready', label: 'ทำได้เลย' },
  { id: 'quick', label: '≤ 15 น.' },
  { id: 'clean', label: 'คลีน' },
];

type Props = {
  selected: HomeFilterId;
  onSelect: (id: HomeFilterId) => void;
};

export function HomeFilterChips({ selected, onSelect }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FILTERS.map((f) => {
        const active = selected === f.id;
        return (
          <Pressable
            key={f.id}
            onPress={() => onSelect(f.id)}
            style={[styles.chip, active && styles.chipActive, active && accentGlow(colors)]}
          >
            <AppText
              variant="label"
              style={{ color: active ? colors.onAccent : colors.inkMuted, fontSize: 14 }}
            >
              {f.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  chipActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
});
