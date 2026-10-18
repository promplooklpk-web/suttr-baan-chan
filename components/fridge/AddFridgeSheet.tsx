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
import { catalogEntryForName, searchIngredientCatalog } from '@/lib/ingredientCatalog';
import { parseQuantityInput } from '@/lib/fridgeQuantity';
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

  const suggestions = useMemo(() => searchIngredientCatalog(catalog, name), [catalog, name]);

  useEffect(() => {
    if (visible) {
      setName(initialName ?? '');
      setQuantity(500);
      setUnit('กรัม');
    }
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
  };

  const addDays = (days: number | null) => {
    if (days == null) {
      setExpiresAt(undefined);
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + days);
    setExpiresAt(d.toISOString().slice(0, 10));
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const q = quantity > 0 ? quantity : parseQuantityInput(String(quantity)) ?? 0;
    if (q <= 0) return;
    setSaving(true);
    try {
      const entry = catalogEntryForName(catalog, trimmed);
      await onSubmit({
        name: trimmed,
        ingredientId: entry?.id,
        quantity: q,
        unit: unit.trim() || 'กรัม',
        place,
        expiresAt,
        note: note.trim() || undefined,
      });
      reset();
      onClose();
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
              onChangeText={setName}
              placeholder="เช่น เนื้อสับ"
              placeholderTextColor={colors.inkLight}
              style={styles.input}
            />
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
              onQuantityChange={setQuantity}
              onUnitChange={setUnit}
            />

            <AppText variant="label" style={styles.labelTop}>ที่เก็บ</AppText>
            <View style={styles.chipRow}>
              {(['chilled', 'frozen', 'dry'] as FridgePlace[]).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPlace(p)}
                  style={[styles.chip, place === p && styles.chipOn]}
                >
                  <AppText variant="caption" style={{ color: place === p ? colors.white : colors.ink }}>
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
                <Pressable key={opt.label} style={styles.chip} onPress={() => addDays(opt.days)}>
                  <AppText variant="caption">{opt.label}</AppText>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.dateBtn} onPress={() => setShowPicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={colors.inkMuted} />
              <AppText muted>{expiresAt ?? 'เลือกวันที่'}</AppText>
            </Pressable>
            {showPicker && (
              <DateTimePicker
                value={expiresAt ? new Date(expiresAt) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  if (Platform.OS !== 'ios') setShowPicker(false);
                  if (date) setExpiresAt(date.toISOString().slice(0, 10));
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

          <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
            <AppText style={styles.saveBtnText}>เพิ่มเข้าตู้เย็น</AppText>
          </Pressable>
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
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
  },
  sheetTitle: { marginBottom: spacing.md },
  scrollContent: { paddingBottom: spacing.xl },
  input: {
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.white, fontFamily: fonts.semiBold, fontSize: 17 },
});
