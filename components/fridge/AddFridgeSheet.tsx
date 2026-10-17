import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import {
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
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { catalogEntryForName, searchIngredientCatalog } from '@/lib/ingredientCatalog';
import { PLACE_LABELS } from '@/lib/fridgeStorage';
import type { FridgePlace } from '@/types/fridge';
import type { IngredientCatalogEntry } from '@/types/fridge';

const UNITS = ['ก.', 'มล.', 'ช้อนโต๊ะ', 'ช้อนชา', 'ถ้วย', 'กำ', 'หัว', 'ฟอง', 'ชิ้น'];

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
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialName ?? '');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('ก.');
  const [place, setPlace] = useState<FridgePlace>('chilled');
  const [expiresAt, setExpiresAt] = useState<string | undefined>();
  const [note, setNote] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const suggestions = useMemo(() => searchIngredientCatalog(catalog, name), [catalog, name]);

  useEffect(() => {
    if (visible) setName(initialName ?? '');
  }, [visible, initialName]);

  const reset = () => {
    setName(initialName ?? '');
    setQuantity(1);
    setUnit('ก.');
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
    setSaving(true);
    try {
      const entry = catalogEntryForName(catalog, trimmed);
      await onSubmit({
        name: trimmed,
        ingredientId: entry?.id,
        quantity,
        unit,
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
      <View style={styles.modalWrap}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <AppText variant="title" style={styles.sheetTitle}>เพิ่มของเข้าตู้เย็น</AppText>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <AppText variant="label">ชื่อ</AppText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="เช่น ใบกะเพรา"
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

          <AppText variant="label" style={styles.labelTop}>จำนวน</AppText>
          <View style={styles.stepperRow}>
            <Pressable style={styles.stepBtn} onPress={() => setQuantity((q) => Math.max(0, q - 1))}>
              <Ionicons name="remove" size={20} color={colors.ink} />
            </Pressable>
            <AppText style={styles.qty}>{quantity}</AppText>
            <Pressable style={styles.stepBtn} onPress={() => setQuantity((q) => q + 1)}>
              <Ionicons name="add" size={20} color={colors.ink} />
            </Pressable>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
              {UNITS.map((u) => (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[styles.unitChip, unit === u && styles.unitChipOn]}
                >
                  <AppText variant="caption" style={{ color: unit === u ? colors.white : colors.ink }}>{u}</AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>

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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
  },
  sheetTitle: { marginBottom: spacing.md },
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
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontFamily: fonts.semiBold, fontSize: 18, minWidth: 32, textAlign: 'center' },
  unitScroll: { flex: 1 },
  unitChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  unitChipOn: { backgroundColor: colors.orange, borderColor: colors.orange },
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
