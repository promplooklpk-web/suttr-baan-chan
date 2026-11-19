import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Glass } from '@/components/Glass';
import { FRIDGE_UNIT_OPTIONS } from '@/lib/fridgeQuantity';
import { parseIngredientLines } from '@/lib/parseIngredientLines';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { RecipeIngredient } from '@/types/recipe';

const EXTRA_UNITS = ['ช้อนชา', 'ถ้วย', 'ลูก', 'ต้น', 'เม็ด', 'กลีบ'] as const;
const UNIT_CHIPS = [...FRIDGE_UNIT_OPTIONS, ...EXTRA_UNITS];

type Props = {
  ingredients: RecipeIngredient[];
  amountTexts: string[];
  onChange: (ings: RecipeIngredient[], amounts: string[]) => void;
  keyboardAppearance: 'default' | 'light' | 'dark';
  onPasteError?: (message: string) => void;
};

export function IngredientRowsEditor({
  ingredients,
  amountTexts,
  onChange,
  keyboardAppearance,
  onPasteError,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [unitMenuRow, setUnitMenuRow] = useState<number | null>(null);
  const [customUnitRow, setCustomUnitRow] = useState<number | null>(null);
  const [customUnitText, setCustomUnitText] = useState('');

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
    if (unitMenuRow === i) setUnitMenuRow(null);
  };

  const applyPaste = () => {
    const parsed = parseIngredientLines(pasteText);
    if (parsed.length === 0) {
      onPasteError?.('ไม่พบรายการ — ลองวางทีละบรรทัด เช่น "ไข่ไก่ 2 ฟอง"');
      return;
    }
    onChange(
      [...ingredients.filter((i) => i.name.trim()), ...parsed],
      [
        ...amountTexts.filter((_, idx) => ingredients[idx]?.name.trim()),
        ...parsed.map((p) => (p.amount != null ? String(p.amount) : '')),
      ],
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
        <View key={i} style={styles.rowCard}>
          <View style={styles.rowHead}>
            <Ionicons name="reorder-three" size={22} color={colors.inkMuted} />
            <TextInput
              keyboardAppearance={keyboardAppearance}
              value={ing.name}
              onChangeText={(v) => updateRow(i, { name: v })}
              placeholder="ชื่อส่วนผสม"
              placeholderTextColor={colors.inkLight}
              style={styles.nameInput}
            />
            <Pressable onPress={() => removeRow(i)} style={styles.trash} hitSlop={12}>
              <Ionicons name="trash-outline" size={22} color={colors.inkLight} />
            </Pressable>
          </View>
          <View style={styles.rowFields}>
            <TextInput
              keyboardAppearance={keyboardAppearance}
              value={amountTexts[i] ?? ''}
              onChangeText={(v) => updateRow(i, {}, v)}
              placeholder="ปริมาณ"
              placeholderTextColor={colors.inkLight}
              keyboardType="decimal-pad"
              style={styles.fieldBox}
            />
            <Pressable
              style={styles.unitBox}
              onPress={() => {
                setUnitMenuRow((prev) => (prev === i ? null : i));
                setCustomUnitRow(null);
              }}
            >
              <AppText variant="label" numberOfLines={1} style={{ flex: 1 }}>
                {ing.unit?.trim() ? ing.unit : 'หน่วย'}
              </AppText>
              <Ionicons name="chevron-down" size={16} color={colors.inkMuted} />
            </Pressable>
          </View>
          {unitMenuRow === i ? (
            <View style={styles.unitPicker}>
              <View style={styles.unitChips}>
                {UNIT_CHIPS.map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => {
                      setCustomUnitRow(null);
                      updateRow(i, { unit: u });
                      setUnitMenuRow(null);
                    }}
                    style={[styles.unitChip, ing.unit === u && styles.unitChipOn]}
                  >
                    <AppText variant="caption" style={{ color: ing.unit === u ? colors.onAccent : colors.inkMuted }}>
                      {u}
                    </AppText>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => {
                    setCustomUnitRow(i);
                    setCustomUnitText(ing.unit ?? '');
                  }}
                  style={[styles.unitChip, customUnitRow === i && styles.unitChipOn]}
                >
                  <AppText variant="caption" style={{ color: customUnitRow === i ? colors.onAccent : colors.inkMuted }}>
                    กำหนดเอง
                  </AppText>
                </Pressable>
              </View>
              {customUnitRow === i ? (
                <TextInput
                  keyboardAppearance={keyboardAppearance}
                  value={customUnitText}
                  onChangeText={setCustomUnitText}
                  onSubmitEditing={() => {
                    const u = customUnitText.trim();
                    if (u) updateRow(i, { unit: u });
                    setCustomUnitRow(null);
                    setUnitMenuRow(null);
                  }}
                  placeholder="หน่วยกำหนดเอง"
                  placeholderTextColor={colors.inkLight}
                  style={styles.customUnitInput}
                />
              ) : null}
            </View>
          ) : null}
        </View>
      ))}
      <Pressable onPress={addRow} style={styles.addLine}>
        <AppText style={{ color: colors.orange }}>+ เพิ่มส่วนผสม</AppText>
      </Pressable>

      <Modal visible={pasteOpen} transparent animationType="slide">
        <Pressable style={styles.modalScrim} onPress={() => setPasteOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Glass variant="material" sheet style={styles.modalSheet}>
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
            </Glass>
          </Pressable>
        </Pressable>
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
    rowCard: {
      marginBottom: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.card,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    rowHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minWidth: 0,
    },
    nameInput: {
      flex: 1,
      minWidth: 0,
      fontFamily: fonts.regular,
      color: colors.ink,
      fontSize: 16,
      paddingVertical: spacing.xs,
    },
    rowFields: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    fieldBox: {
      flex: 1,
      backgroundColor: colors.surface2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      fontFamily: fonts.regular,
      color: colors.ink,
      minWidth: 0,
    },
    unitBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.surface2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      minHeight: 44,
    },
    unitPicker: { gap: spacing.sm },
    unitChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    unitChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      minHeight: 32,
      justifyContent: 'center',
    },
    unitChipOn: { backgroundColor: colors.orange, borderColor: colors.orange },
    trash: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    customUnitInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.sm,
      fontFamily: fonts.regular,
      color: colors.ink,
      backgroundColor: colors.surface2,
    },
    addLine: { paddingVertical: spacing.sm, minHeight: 44, justifyContent: 'center' },
    modalScrim: {
      flex: 1,
      backgroundColor: colors.modalScrim,
      justifyContent: 'flex-end',
    },
    modalSheet: {
      padding: spacing.md,
      gap: spacing.sm,
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
      backgroundColor: colors.surface2,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 44,
    },
  });