import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { CATEGORIES, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { accentGlow } from '@/lib/design';

type CategoryChipsProps = {
  selected: string;
  onSelect: (category: string) => void;
  categories?: readonly string[];
};

export function CategoryChips({ selected, onSelect, categories }: CategoryChipsProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const items = categories ?? CATEGORIES;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map((cat) => {
        const active = selected === cat;
        return (
          <Pressable
            key={cat}
            onPress={() => onSelect(cat)}
            style={[styles.chip, active && styles.chipActive, active && accentGlow(colors)]}
          >
            <AppText
              variant="label"
              style={{ color: active ? colors.onAccent : colors.inkMuted, fontSize: 14 }}
            >
              {cat}
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
