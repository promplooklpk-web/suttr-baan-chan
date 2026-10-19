import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { FridgeQuantityEditor } from '@/components/fridge/FridgeQuantityEditor';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { emitFeedback } from '@/lib/feedbackBus';
import { catalogEntryForName, searchIngredientCatalog } from '@/lib/ingredientCatalog';
import {
  defaultExpiryForPlace,
  defaultQuantityForName,
  formatExpiryFriendly,
} from '@/lib/catalogDefaults';
import { parseQuantityInput } from '@/lib/fridgeQuantity';
import { addDaysLocal, localDateToIso, todayLocalIso } from '@/utils/localDate';
import { PLACE_LABELS } from '@/lib/fridgeStorage';
import type { FridgePlace } from '@/types/fridge';
import type { IngredientCatalogEntry } from '@/types/fridge';

type Props = {
  visible: boolean;
  onClose: () => void;
  catalog: IngredientCatalogEntry[];
  initialName?: string;
  onSubmit: (data: {
    name: string;
    ingredientId?: string;
    quantity: number;
    unit: string;
    place: FridgePlace;
    expiresAt?: string;
    note?: string;
  }) => Promise<void>;
};

export function AddFridgeSheet({ visible, onClose, catalog, initialName, onSubmit }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors, keyboardAppearance } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialName ?? '');
  const [quantity, setQuantity] = useState(500);
  const [unit, setUnit] = useState('กรัม');
  const [place, setPlace] = useState<FridgePlace>('chilled');
  const [expiresAt, setExpiresAt] = useState<string | undefined>();
  const [note, setNote] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; quantity?: string }>({});
  const [presetLabel, setPresetLabel] = useState<string | null>(null);

  const suggestions = useMemo(() => searchIngredientCatalog(catalog, name), [catalog, name]);

  useEffect(() => {
    if (!visible) return;
    setName(initialName ?? '');
    setQuantity(500);
    setUnit('กรัม');
    setPlace('chilled');
    setExpiresAt(undefined);
    setNote('');
  }, [visible, initialName]);

  const reset = () => {
    setName(initialName ?? '');
    setQuantity(500);
    setUnit('กรัม');
    setPlace('chilled');
    setExpiresAt(undefined);
    setNote('');
  };

  const pickSuggestion = (entry: IngredientCatalogEntry) => {
    setName(entry.name);
    const defaults = defaultQuantityForName(entry.name);
    setQuantity(defaults.quantity);
    setUnit(defaults.unit);
    const exp = defaultExpiryForPlace(place);
    setExpiresAt(exp);
    setPresetLabel(exp ? '+ตามที่เก็บ' : 'ไม่ระบุ');
  };

  const addDays = (days: number | null, label: string) => {
    setPresetLabel(label);
    if (days == null) {
      setExpiresAt(undefined);
      return;
    }
    setExpiresAt(addDaysLocal(todayLocalIso(), days));
  };

  useEffect(() => {
    if (!visible) return;
    const exp = defaultExpiryForPlace(place);
    setExpiresAt(exp);
    setPresetLabel(place === 'dry' ? 'ไม่ระบุ' : place === 'frozen' ? '+1 เดือน' : '+3 วัน');
  }, [place, visible]);

  const save = async (continueAdding = false) => {
    const trimmed = name.trim();
    const errors: { name?: string; quantity?: string } = {};
    if (!trimmed) errors.name = 'กรุณากรอกชื่อของ';
    let q = quantity > 0 ? quantity : parseQuantityInput(String(quantity)) ?? 0;
    let u = unit.trim() || 'กรัม';
    if (!presetLabel && trimmed) {
      const defaults = defaultQuantityForName(trimmed);
      if (quantity === 500 && unit === 'กรัม') {
        q = defaults.quantity;
        u = defaults.unit;
      }
    }
    if (q <= 0) errors.quantity = 'จำนวนต้องมากกว่า 0';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const entry = catalogEntryForName(catalog, trimmed);
      await onSubmit({
        name: trimmed,
        ingredientId: entry?.id,
        quantity: q,
        unit: u,
        place,
        expiresAt,
        note: note.trim() || undefined,
      });
      if (continueAdding) {
        setName('');
        setQuantity(500);
        setUnit('กรัม');
        setNote('');
        setPresetLabel(null);
        const exp = defaultExpiryForPlace(place);
        setExpiresAt(exp);
      } else {
        reset();
        onClose();
      }
    } catch (e) {
      emitFeedback(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ', { error: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <AppText variant="title" style={styles.sheetTitle}>เพิ่มของเข้าตู้เย็น</AppText>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <AppText variant="label">ชื่อ</AppText>
            <TextInput
          keyboardAppearance={keyboardAppearance}
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (fieldErrors.name) setFieldErrors((e) => ({ ...e, name: undefined }));
              }}
              onBlur={() => {
                const trimmed = name.trim();
                if (!trimmed || presetLabel) return;
                const defaults = defaultQuantityForName(trimmed);
                setQuantity(defaults.quantity);
                setUnit(defaults.unit);
              }}
              placeholder="เช่น เนื้อสับ"
              placeholderTextColor={colors.inkLight}
              style={[styles.input, fieldErrors.name && styles.inputError]}
            />
            {fieldErrors.name ? (
              <AppText variant="caption" style={styles.fieldError}>{fieldErrors.name}</AppText>
            ) : null}
            {suggestions.length > 0 && name.trim().length > 0 && (
              <View style={styles.suggestBox}>
                {suggestions.map((s) => (
                  <Pressable key={s.id} style={styles.suggestRow} onPress={() => pickSuggestion(s)}>
                    <AppText>{s.name}</AppText>
                    <AppText variant="caption" muted>ใช้ใน {s.recipeCount} สูตร</AppText>
                  </Pressable>
                ))}
              </View>
            )}

            <FridgeQuantityEditor
              quantity={quantity}
              unit={unit}
              onQuantityChange={(v) => {
                setQuantity(v);
                if (fieldErrors.quantity) setFieldErrors((e) => ({ ...e, quantity: undefined }));
              }}
              onUnitChange={setUnit}
            />
            {fieldErrors.quantity ? (
              <AppText variant="caption" style={styles.fieldError}>{fieldErrors.quantity}</AppText>
            ) : null}

            <AppText variant="label" style={styles.labelTop}>ที่เก็บ</AppText>
            <View style={styles.chipRow}>
              {(['chilled', 'frozen', 'dry'] as FridgePlace[]).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPlace(p)}
                  style={[styles.chip, place === p && styles.chipOn]}
                >
                  <AppText variant="caption" style={{ color: place === p ? colors.surface : colors.ink }}>
                    {PLACE_LABELS[p]}
                  </AppText>
                </Pressable>
              ))}
            </View>

            <AppText variant="label" style={styles.labelTop}>วันหมดอายุ</AppText>
            <View style={styles.chipRow}>
              {[
                { label: '+3 วัน', days: 3 },
                { label: '+7 วัน', days: 7 },
                { label: '+1 เดือน', days: 30 },
                { label: 'ไม่ระบุ', days: null },
              ].map((opt) => (
                <Pressable
                  key={opt.label}
                  style={[styles.chip, presetLabel === opt.label && styles.chipOn]}
                  onPress={() => addDays(opt.days, opt.label)}
                >
                  <AppText variant="caption" style={{ color: presetLabel === opt.label ? colors.onAccent : colors.ink }}>
                    {opt.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.dateBtn} onPress={() => setShowPicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={colors.inkMuted} />
              <AppText muted>{formatExpiryFriendly(expiresAt)}</AppText>
            </Pressable>
            {showPicker && (
              <DateTimePicker
                value={expiresAt ? new Date(expiresAt) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  if (Platform.OS !== 'ios') setShowPicker(false);
                  if (date) setExpiresAt(localDateToIso(date));
                }}
              />
            )}
            {Platform.OS === 'ios' && showPicker && (
              <Pressable onPress={() => setShowPicker(false)}>
                <AppText style={{ color: colors.orange, textAlign: 'center' }}>เสร็จ</AppText>
              </Pressable>
            )}

            <AppText variant="label" style={styles.labelTop}>โน้ต</AppText>
            <TextInput
          keyboardAppearance={keyboardAppearance}
              value={note}
              onChangeText={setNote}
              placeholder="เพิ่มรายละเอียด"
              placeholderTextColor={colors.inkLight}
              style={[styles.input, styles.noteInput]}
              multiline
            />
          </ScrollView>

          <View style={styles.saveRow}>
            <Pressable
              style={[styles.saveBtn, styles.saveSecondary, saving && { opacity: 0.6 }]}
              onPress={() => save(true)}
              disabled={saving}
            >
              <AppText style={styles.saveBtnTextSecondary}>เพิ่มต่อ</AppText>
            </Pressable>
            <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={() => save(false)} disabled={saving}>
              <AppText style={styles.saveBtnText}>เพิ่มเข้าตู้เย็น</AppText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.modalScrim },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
  },
  sheetTitle: { marginBottom: spacing.md },
  scrollContent: { paddingBottom: spacing.xl },
  fieldError: { color: colors.danger, marginTop: 4 },
  inputError: { borderColor: colors.danger },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  noteInput: { minHeight: 72, textAlignVertical: 'top' },
  suggestBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  suggestRow: {
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  labelTop: { marginTop: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  saveSecondary: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtnText: { color: colors.onAccent, fontFamily: fonts.semiBold, fontSize: 17 },
  saveBtnTextSecondary: { color: colors.ink, fontFamily: fonts.semiBold, fontSize: 17 },
});
