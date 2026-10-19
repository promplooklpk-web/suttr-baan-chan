import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { FRIDGE_UNIT_OPTIONS } from '@/lib/fridgeQuantity';
import { parseIngredientLines } from '@/lib/parseIngredientLines';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { RecipeIngredient } from '@/types/recipe';

const EXTRA_UNITS = ['ช้อนชา', 'ถ้วย', 'ลูก'] as const;
const UNIT_CHIPS = [...FRIDGE_UNIT_OPTIONS, ...EXTRA_UNITS];

type Props = {
  ingredients: RecipeIngredient[];
  amountTexts: string[];
  onChange: (ings: RecipeIngredient[], amounts: string[]) => void;
  keyboardAppearance: 'default' | 'light' | 'dark';
};

export function IngredientRowsEditor({
  ingredients,
  amountTexts,
  onChange,
  keyboardAppearance,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const updateRow = (i: number, patch: Partial<RecipeIngredient>, amountText?: string) => {
    const next = [...ingredients];
    next[i] = { ...next[i], ...patch };
    const amounts = [...amountTexts];
    if (amountText != null) amounts[i] = amountText;
    onChange(next, amounts);
  };

  const addRow = () => onChange([...ingredients, { name: '', unit: '' }], [...amountTexts, '']);

  const removeRow = (i: number) => {
    onChange(
      ingredients.filter((_, idx) => idx !== i),
      amountTexts.filter((_, idx) => idx !== i),
    );
  };

  const applyPaste = () => {
    const parsed = parseIngredientLines(pasteText);
    if (parsed.length === 0) {
      Alert.alert('ไม่พบรายการ', 'ลองวางทีละบรรทัด เช่น "ไข่ไก่ 2 ฟอง"');
      return;
    }
    onChange(
      [...ingredients.filter((i) => i.name.trim()), ...parsed],
      [...amountTexts.filter((_, idx) => ingredients[idx]?.name.trim()), ...parsed.map((p) => (p.amount != null ? String(p.amount) : ''))],
    );
    setPasteOpen(false);
    setPasteText('');
  };

  return (
    <View>
      <Pressable style={styles.pasteBtn} onPress={() => setPasteOpen(true)}>
        <Ionicons name="clipboard-outline" size={18} color={colors.orange} />
        <AppText variant="label" style={{ color: colors.orange }}>วางรายการส่วนผสม</AppText>
      </Pressable>
      {ingredients.map((ing, i) => (
        <View key={i} style={styles.row}>
          <TextInput
            keyboardAppearance={keyboardAppearance}
            value={ing.name}
            onChangeText={(v) => updateRow(i, { name: v })}
            placeholder="ชื่อส่วนผสม"
            placeholderTextColor={colors.inkLight}
            style={styles.nameInput}
          />
          <View style={styles.amountRow}>
            <TextInput
              keyboardAppearance={keyboardAppearance}
              value={amountTexts[i] ?? ''}
              onChangeText={(v) => updateRow(i, {}, v)}
              placeholder="ปริมาณ"
              placeholderTextColor={colors.inkLight}
              keyboardType="decimal-pad"
              style={styles.amountInput}
            />
            <View style={styles.unitChips}>
              {UNIT_CHIPS.slice(0, 8).map((u) => (
                <Pressable
                  key={u}
                  onPress={() => updateRow(i, { unit: u })}
                  style={[styles.unitChip, ing.unit === u && styles.unitChipOn]}
                >
                  <AppText variant="caption" style={{ color: ing.unit === u ? colors.onAccent : colors.inkMuted }}>
                    {u}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable onPress={() => removeRow(i)} style={styles.trash} hitSlop={12}>
            <Ionicons name="trash-outline" size={22} color={colors.inkLight} />
          </Pressable>
        </View>
      ))}
      <Pressable onPress={addRow} style={styles.addLine}>
        <AppText style={{ color: colors.orange }}>+ เพิ่มส่วนผสม</AppText>
      </Pressable>

      <Modal visible={pasteOpen} transparent animationType="slide">
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <AppText variant="title">วางรายการส่วนผสม</AppText>
            <TextInput
              multiline
              value={pasteText}
              onChangeText={setPasteText}
              placeholder="หนึ่งบรรทัดต่อหนึ่งรายการ"
              placeholderTextColor={colors.inkLight}
              style={styles.pasteInput}
              keyboardAppearance={keyboardAppearance}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setPasteOpen(false)}>
                <AppText muted>ยกเลิก</AppText>
              </Pressable>
              <Pressable onPress={applyPaste}>
                <AppText style={{ color: colors.orange }}>เพิ่มรายการ</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    pasteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
      minHeight: 44,
    },
    row: {
      marginBottom: spacing.md,
      gap: spacing.sm,
      minWidth: 0,
    },
    nameInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.sm,
      fontFamily: fonts.regular,
      color: colors.ink,
      minWidth: 0,
    },
    amountRow: { gap: spacing.sm, minWidth: 0 },
    amountInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.sm,
      fontFamily: fonts.regular,
      color: colors.ink,
      minWidth: 0,
    },
    unitChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    unitChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      minHeight: 36,
      justifyContent: 'center',
    },
    unitChipOn: { backgroundColor: colors.orange, borderColor: colors.orange },
    trash: { alignSelf: 'flex-end', minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    addLine: { paddingVertical: spacing.sm, minHeight: 44, justifyContent: 'center' },
    modalScrim: {
      flex: 1,
      backgroundColor: colors.modalScrim,
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: colors.cream,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.md,
      gap: spacing.sm,
      maxHeight: '70%',
    },
    pasteInput: {
      minHeight: 160,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.sm,
      textAlignVertical: 'top',
      color: colors.ink,
      fontFamily: fonts.regular,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 44,
    },
  });
