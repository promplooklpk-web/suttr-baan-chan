import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export type PickerCategoryFilter = 'ทั้งหมด' | 'คลีน' | 'จานเดียว';

type Props = {
  visible: boolean;
  onClose: () => void;
  category: PickerCategoryFilter;
  onCategory: (c: PickerCategoryFilter) => void;
  maxMinutes: number | null;
  onMaxMinutes: (m: number | null) => void;
  maxCalories: number | null;
  onMaxCalories: (c: number | null) => void;
  prioritizeFridge: boolean;
  onPrioritizeFridge: (v: boolean) => void;
  fridgeAvailable: boolean;
  onReset: () => void;
};

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <AppText variant="caption" style={{ color: active ? colors.onAccent : colors.ink, fontFamily: fonts.medium }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function PickerFilterSheet({
  visible,
  onClose,
  category,
  onCategory,
  maxMinutes,
  onMaxMinutes,
  maxCalories,
  onMaxCalories,
  prioritizeFridge,
  onPrioritizeFridge,
  fridgeAvailable,
  onReset,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.sheetHeader}>
          <AppText variant="title">ตัวกรอง</AppText>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
        </View>

        <AppText variant="caption" muted style={styles.sectionLabel}>หมวด</AppText>
        <View style={styles.chipRow}>
          {(['ทั้งหมด', 'คลีน', 'จานเดียว'] as PickerCategoryFilter[]).map((c) => (
            <FilterChip key={c} label={c} active={category === c} onPress={() => onCategory(c)} />
          ))}
        </View>

        <AppText variant="caption" muted style={styles.sectionLabel}>เวลาทำ</AppText>
        <View style={styles.chipRow}>
          {[null, 15, 30, 45].map((m) => (
            <FilterChip
              key={String(m)}
              label={m == null ? 'ไม่จำกัด' : `≤ ${m} น.`}
              active={maxMinutes === m}
              onPress={() => onMaxMinutes(m)}
            />
          ))}
        </View>

        <AppText variant="caption" muted style={styles.sectionLabel}>แคลอรี</AppText>
        <View style={styles.chipRow}>
          {[null, 300, 500, 700].map((c) => (
            <FilterChip
              key={String(c)}
              label={c == null ? 'ไม่จำกัด' : `≤ ${c} kcal`}
              active={maxCalories === c}
              onPress={() => onMaxCalories(c)}
            />
          ))}
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="label">ใช้ของในตู้เย็นก่อน</AppText>
            <AppText variant="caption" muted>
              {fridgeAvailable ? 'เน้นเมนูที่มีของในตู้มากก่อน' : 'เพิ่มของในตู้เย็นเพื่อใช้ตัวกรองนี้'}
            </AppText>
          </View>
          <Switch
            value={prioritizeFridge}
            onValueChange={onPrioritizeFridge}
            disabled={!fridgeAvailable}
            trackColor={{ true: colors.orange, false: colors.border }}
          />
        </View>

        <Pressable style={styles.resetBtn} onPress={onReset}>
          <AppText style={styles.resetText}>รีเซ็ตตัวกรอง</AppText>
        </Pressable>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.modalScrim,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionLabel: { marginBottom: spacing.xs, marginTop: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  resetBtn: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetText: { fontFamily: fonts.semiBold, color: colors.inkMuted },
});
