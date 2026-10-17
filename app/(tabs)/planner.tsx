import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useMealPlan } from '@/context/MealPlanContext';
import { useRecipes } from '@/context/RecipesContext';
import type { MealSlot } from '@/types/mealPlan';

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'เช้า',
  lunch: 'กลางวัน',
  dinner: 'เย็น',
};

const DAY_LABELS = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const { plan, shopping, assignMeal, changeWeek, toggleShoppingItem, rebuildShoppingList } = useMealPlan();
  const { recipes, getRecipe } = useRecipes();
  const [picker, setPicker] = useState<{ date: string; slot: MealSlot } | null>(null);

  const days = plan?.days ?? [];

  const checkedCount = useMemo(
    () => shopping.filter((i) => i.checked).length,
    [shopping],
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + 120,
        paddingHorizontal: spacing.md,
      }}
    >
      <View style={styles.weekHeader}>
        <Pressable onPress={() => changeWeek(-1)}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <AppText variant="title">แพลนมื้อสัปดาห์</AppText>
        <Pressable onPress={() => changeWeek(1)}>
          <Ionicons name="chevron-forward" size={24} color={colors.ink} />
        </Pressable>
      </View>

      {days.map((day, idx) => {
        const label = DAY_LABELS[idx] ?? day.date;
        return (
          <View key={day.date} style={styles.dayCard}>
            <AppText variant="label">{label} {day.date.slice(5).replace('-', '/')}</AppText>
            {(['breakfast', 'lunch', 'dinner'] as MealSlot[]).map((slot) => {
              const rid = day.meals[slot];
              const title = rid ? getRecipe(rid)?.title ?? 'ไม่พบสูตร' : 'ว่าง';
              return (
                <Pressable
                  key={slot}
                  style={styles.mealRow}
                  onPress={() => setPicker({ date: day.date, slot })}
                >
                  <AppText variant="caption" muted style={styles.slotLabel}>{SLOT_LABELS[slot]}</AppText>
                  <AppText style={styles.mealTitle} numberOfLines={1}>{title}</AppText>
                  <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
                </Pressable>
              );
            })}
          </View>
        );
      })}

      <View style={styles.shopSection}>
        <View style={styles.shopHeader}>
          <AppText variant="title">รายการซื้อของ</AppText>
          <Pressable onPress={rebuildShoppingList}>
            <AppText style={{ color: colors.orange }}>รีเฟรช</AppText>
          </Pressable>
        </View>
        <AppText variant="caption" muted style={{ marginBottom: spacing.sm }}>
          {checkedCount}/{shopping.length} รายการ
        </AppText>
        {shopping.map((item) => (
          <Pressable
            key={item.id}
            style={styles.shopRow}
            onPress={() => toggleShoppingItem(item.id)}
          >
            <Ionicons
              name={item.checked ? 'checkbox' : 'square-outline'}
              size={22}
              color={item.checked ? colors.orange : colors.inkMuted}
            />
            <AppText style={[styles.shopName, item.checked && styles.shopChecked]}>{item.name}</AppText>
            <AppText muted>
              {[item.amount, item.unit].filter(Boolean).join(' ')}
            </AppText>
          </Pressable>
        ))}
      </View>

      <Modal visible={picker != null} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <AppText variant="title" style={{ marginBottom: spacing.md }}>เลือกสูตร</AppText>
            <ScrollView style={{ maxHeight: 360 }}>
              {recipes.map((r) => (
                <Pressable
                  key={r.id}
                  style={styles.pickRow}
                  onPress={async () => {
                    if (picker) await assignMeal(picker.date, picker.slot, r.id);
                    setPicker(null);
                  }}
                >
                  <AppText>{r.title}</AppText>
                </Pressable>
              ))}
            </ScrollView>
            {picker && (
              <Pressable
                style={styles.clearMeal}
                onPress={async () => {
                  await assignMeal(picker.date, picker.slot, undefined);
                  setPicker(null);
                }}
              >
                <AppText style={{ color: colors.danger }}>ล้างมื้อนี้</AppText>
              </Pressable>
            )}
            <Pressable onPress={() => setPicker(null)}>
              <AppText muted style={{ textAlign: 'center', marginTop: spacing.md }}>ปิด</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  dayCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  slotLabel: { width: 56 },
  mealTitle: { flex: 1, fontFamily: fonts.medium },
  shopSection: { marginTop: spacing.lg },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  shopName: { flex: 1 },
  shopChecked: { textDecorationLine: 'line-through', color: colors.inkMuted },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  pickRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  clearMeal: { marginTop: spacing.md, alignItems: 'center' },
});
