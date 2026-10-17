import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { RecipeCoverImage } from '@/components/RecipeCoverImage';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useFridge } from '@/context/FridgeContext';
import { useRecipes } from '@/context/RecipesContext';
import { daysUntilExpiry, formatExpiryLine, fridgeItemStatus } from '@/lib/fridgeStatus';
import { ingredientNamesMatch } from '@/lib/ingredientNormalize';
import { PLACE_LABELS } from '@/lib/fridgeStorage';

export default function FridgeItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { items, updateItem, removeItem, useItem } = useFridge();
  const { recipes } = useRecipes();
  const item = items.find((i) => i.id === id);
  const [note, setNote] = useState(item?.note ?? '');
  const [qty, setQty] = useState(String(item?.quantity ?? 1));

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
    const q = parseFloat(qty);
    if (Number.isNaN(q)) return;
    await updateItem(item.id, { note, quantity: q });
    Alert.alert('บันทึกแล้ว');
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
    >
      <AppText variant="title">{item.name}</AppText>
      <AppText variant="caption" style={{ color: barColor, marginTop: spacing.xs }}>
        {formatExpiryLine(item)}
      </AppText>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${freshnessRatio * 100}%`, backgroundColor: barColor }]} />
      </View>
      <AppText variant="caption" muted style={{ marginBottom: spacing.lg }}>
        {PLACE_LABELS[item.place]} · {item.quantity} {item.unit}
      </AppText>

      <View style={styles.quickRow}>
        {(
          [
            ['half', 'ใช้ไปครึ่งหนึ่ง'],
            ['one', 'ใช้ไป 1 กำ'],
            ['all', 'ใช้หมดแล้ว'],
          ] as const
        ).map(([mode, label]) => (
          <Pressable
            key={mode}
            style={styles.quickBtn}
            onPress={async () => {
              await useItem(item.id, mode);
              if (mode === 'all') router.back();
            }}
          >
            <AppText variant="caption" style={styles.quickText}>{label}</AppText>
          </Pressable>
        ))}
      </View>

      <AppText variant="label">จำนวน</AppText>
      <TextInput
        value={qty}
        onChangeText={setQty}
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <AppText variant="label" style={{ marginTop: spacing.md }}>โน้ต</AppText>
      <TextInput value={note} onChangeText={setNote} style={[styles.input, styles.note]} multiline />

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
          onPress={() => {
            Alert.alert('ลบรายการ?', item.name, [
              { text: 'ยกเลิก', style: 'cancel' },
              {
                text: 'ลบ',
                style: 'destructive',
                onPress: async () => {
                  await removeItem(item.id);
                  router.back();
                },
              },
            ]);
          }}
        >
          <AppText style={{ color: colors.danger, fontFamily: fonts.semiBold }}>ลบ</AppText>
        </Pressable>
        <Pressable style={styles.saveBtn} onPress={save}>
          <AppText style={styles.saveBtnText}>บันทึกการแก้ไข</AppText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  quickRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.lg },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  quickText: { textAlign: 'center', fontFamily: fonts.medium },
  input: {
    backgroundColor: colors.white,
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
  saveBtnText: { color: colors.white, fontFamily: fonts.semiBold },
});
