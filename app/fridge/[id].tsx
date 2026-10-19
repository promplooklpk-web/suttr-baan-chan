import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
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
import { FridgeUseAmountPanel } from '@/components/fridge/FridgeUseAmountPanel';
import { RecipeCoverImage } from '@/components/RecipeCoverImage';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useFridge } from '@/context/FridgeContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { useRecipes } from '@/context/RecipesContext';
import { daysUntilExpiry, formatExpiryLine, fridgeItemStatus } from '@/lib/fridgeStatus';
import { addDaysLocal, localDateToIso, todayLocalIso } from '@/utils/localDate';
import { ingredientNamesMatch } from '@/lib/ingredientNormalize';
import { PLACE_LABELS } from '@/lib/fridgeStorage';
import type { FridgePlace } from '@/types/fridge';

export default function FridgeItemDetailScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors, keyboardAppearance } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { items, updateItem, removeItem, subtractAmount, addItem } = useFridge();
  const { showSnackbar } = useSnackbar();
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; quantity?: string }>({});
  const { recipes } = useRecipes();
  const item = items.find((i) => i.id === id);
  const [itemName, setItemName] = useState(item?.name ?? '');
  const [expiresAt, setExpiresAt] = useState(item?.expiresAt);
  const [note, setNote] = useState(item?.note ?? '');
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [unit, setUnit] = useState(item?.unit ?? 'กรัม');
  const [place, setPlace] = useState<FridgePlace>(item?.place ?? 'chilled');

  useEffect(() => {
    if (!item) return;
    setItemName(item.name);
    setExpiresAt(item.expiresAt);
    setNote(item.note ?? '');
    setQuantity(item.quantity);
    setUnit(item.unit);
    setPlace(item.place);
  }, [item?.id, item?.quantity, item?.unit, item?.note, item?.place]);

  const status = item ? fridgeItemStatus(item) : null;
  const daysLeft = item ? daysUntilExpiry(item.expiresAt) : null;
  const freshnessRatio = useMemo(() => {
    if (daysLeft == null) return 0.5;
    if (daysLeft < 0) return 0;
    if (daysLeft > 14) return 1;
    return daysLeft / 14;
  }, [daysLeft]);

  const linkedRecipes = useMemo(() => {
    if (!item) return [];
    return recipes
      .filter((r) => r.ingredients.some((ing) => ingredientNamesMatch(ing.name, item.name)))
      .slice(0, 6);
  }, [item, recipes]);

  if (!item) {
    return (
      <View style={styles.centered}>
        <AppText>ไม่พบรายการ</AppText>
      </View>
    );
  }

  const barColor =
    status?.kind === 'expired'
      ? colors.danger
      : status?.kind === 'expiring'
        ? colors.cardYellow
        : colors.cardGreen;

  const save = async () => {
    const errors: { name?: string; quantity?: string } = {};
    if (quantity <= 0) errors.quantity = 'จำนวนต้องมากกว่า 0';
    const trimmed = itemName.trim();
    if (!trimmed) errors.name = 'กรุณากรอกชื่อของ';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    await updateItem(item.id, {
      name: trimmed,
      note,
      quantity,
      unit,
      place,
      expiresAt,
    });
    showSnackbar('บันทึกแล้ว');
  };

  const onSubtract = async (amount: number) => {
    await subtractAmount(item.id, amount);
    const left = item.quantity - amount;
    if (left <= 0) router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="label" muted>ชื่อ</AppText>
        <TextInput
          keyboardAppearance={keyboardAppearance}
          value={itemName}
          onChangeText={(v) => {
            setItemName(v);
            if (fieldErrors.name) setFieldErrors((e) => ({ ...e, name: undefined }));
          }}
          style={[styles.input, fieldErrors.name && styles.inputError]}
        />
        {fieldErrors.name ? (
          <AppText variant="caption" style={styles.fieldError}>{fieldErrors.name}</AppText>
        ) : null}
        <AppText variant="caption" style={{ color: barColor, marginTop: spacing.xs }}>
          {formatExpiryLine({ ...item, name: itemName, expiresAt })}
        </AppText>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${freshnessRatio * 100}%`, backgroundColor: barColor }]} />
        </View>
        <AppText variant="caption" muted style={{ marginBottom: spacing.sm }}>
          {PLACE_LABELS[place]}
        </AppText>

        <FridgeUseAmountPanel item={{ ...item, quantity, unit }} onSubtract={onSubtract} />

        <FridgeQuantityEditor
          label="จำนวนคงเหลือ"
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

        <AppText variant="label" style={{ marginTop: spacing.lg }}>ที่เก็บ</AppText>
        <View style={styles.placeRow}>
          {(['chilled', 'frozen', 'dry'] as FridgePlace[]).map((p) => (
            <Pressable
              key={p}
              style={[styles.placeChip, place === p && styles.placeChipOn]}
              onPress={() => setPlace(p)}
            >
              <AppText variant="caption" style={{ color: place === p ? colors.surface : colors.ink }}>
                {PLACE_LABELS[p]}
              </AppText>
            </Pressable>
          ))}
        </View>

        <AppText variant="label" style={{ marginTop: spacing.md }}>วันหมดอายุ</AppText>
        <View style={styles.placeRow}>
          <Pressable style={styles.placeChip} onPress={() => setExpiresAt(addDaysLocal(todayLocalIso(), 3))}>
            <AppText variant="caption">+3 วัน</AppText>
          </Pressable>
          <Pressable style={styles.placeChip} onPress={() => setExpiresAt(addDaysLocal(todayLocalIso(), 7))}>
            <AppText variant="caption">+7 วัน</AppText>
          </Pressable>
          <Pressable style={styles.placeChip} onPress={() => setExpiresAt(undefined)}>
            <AppText variant="caption">ไม่ระบุ</AppText>
          </Pressable>
        </View>
        {expiresAt ? (
          <AppText variant="caption" muted>{expiresAt}</AppText>
        ) : null}

        <AppText variant="label" style={{ marginTop: spacing.md }}>โน้ต</AppText>
        <TextInput
          keyboardAppearance={keyboardAppearance}
          value={note}
          onChangeText={setNote}
          style={[styles.input, styles.note]}
          multiline
        />

        {linkedRecipes.length > 0 && (
          <View style={styles.recipes}>
            <AppText variant="label" style={{ marginBottom: spacing.sm }}>ใช้ในสูตร</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {linkedRecipes.map((r) => (
                <Pressable key={r.id} style={styles.recipeThumb} onPress={() => router.push(`/recipe/${r.id}`)}>
                  <RecipeCoverImage recipe={r} style={styles.thumbImg} rounded={radius.md} />
                  <AppText variant="caption" numberOfLines={2} style={styles.thumbTitle}>{r.title}</AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.footer}>
          <Pressable
            onPress={async () => {
              const snapshot = { ...item, name: itemName, note, quantity, unit, place, expiresAt };
              await removeItem(item.id);
              showSnackbar(`ลบ ${item.name} แล้ว`, async () => {
                await addItem({
                  name: snapshot.name,
                  quantity: snapshot.quantity,
                  unit: snapshot.unit,
                  place: snapshot.place,
                  expiresAt: snapshot.expiresAt,
                  note: snapshot.note,
                  ingredientId: snapshot.ingredientId,
                });
              });
              router.back();
            }}
          >
            <AppText style={{ color: colors.danger, fontFamily: fonts.semiBold }}>ลบ</AppText>
          </Pressable>
          <Pressable style={styles.saveBtn} onPress={save}>
            <AppText style={styles.saveBtnText}>บันทึกการแก้ไข</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  barBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  barFill: { height: 8 },
  placeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  placeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeChipOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  fieldError: { color: colors.danger, marginTop: 4 },
  inputError: { borderColor: colors.danger },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  note: { minHeight: 80, textAlignVertical: 'top' },
  recipes: { marginTop: spacing.lg },
  recipeThumb: { width: 100, marginRight: spacing.md },
  thumbImg: { width: 100, height: 80 },
  thumbTitle: { marginTop: 4 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  saveBtn: {
    backgroundColor: colors.orange,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  saveBtnText: { color: colors.surface, fontFamily: fonts.semiBold },
});
