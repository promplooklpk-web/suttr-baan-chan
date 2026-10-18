import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { FloatingHeader, floatingHeaderClearance } from '@/components/FloatingHeader';
import { ScreenShell } from '@/components/ScreenShell';
import { accentGlow } from '@/lib/design';
import { RecipeCoverImage } from '@/components/RecipeCoverImage';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useFridge } from '@/context/FridgeContext';
import { useMealPlan } from '@/context/MealPlanContext';
import { useRecipes } from '@/context/RecipesContext';
import { fridgeProgressColor } from '@/lib/fridgeMatchDisplay';
import { matchRecipeToFridge } from '@/lib/fridgeMatch';
import { pickRandom } from '@/lib/pickerHistory';
import { parseRecipeCalories } from '@/lib/recipeMedia';
import { totalMinutes } from '@/lib/storage';
import type { MealPlanDay } from '@/types/mealPlan';
import type { MealSlot } from '@/types/mealPlan';
import type { Recipe } from '@/types/recipe';

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'เช้า',
  lunch: 'กลางวัน',
  dinner: 'เย็น',
};

const SLOT_ICONS: Record<MealSlot, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
};

const DAY_LABELS = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeekLocal(d: Date): Date {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function dayHasMeals(day: MealPlanDay): boolean {
  return Object.keys(day.meals).length > 0;
}

function sumDayCalories(day: MealPlanDay, getRecipe: (id: string) => Recipe | undefined): number {
  let total = 0;
  for (const rid of Object.values(day.meals)) {
    if (!rid) continue;
    const recipe = getRecipe(rid);
    if (!recipe) continue;
    const cal = parseRecipeCalories(recipe);
    if (cal != null) total += cal;
  }
  return total;
}

export default function PlannerScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { plan, shopping, assignMeal, changeWeek, toggleShoppingItem, rebuildShoppingList } =
    useMealPlan();
  const { recipes, getRecipe } = useRecipes();
  const { items: fridgeItems } = useFridge();
  const [picker, setPicker] = useState<{ date: string; slot: MealSlot } | null>(null);
  const params = useLocalSearchParams<{ section?: string }>();
  const [section, setSection] = useState<'plan' | 'shop'>(
    params.section === 'shop' ? 'shop' : 'plan',
  );
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const headerClearance = floatingHeaderClearance(insets.top);

  const days = plan?.days ?? [];
  const today = todayIso();

  useEffect(() => {
    if (days.length === 0) return;
    if (days.some((d) => d.date === selectedDate)) return;
    const todayInWeek = days.find((d) => d.date === today);
    setSelectedDate(todayInWeek?.date ?? days[0].date);
  }, [days, selectedDate, today]);

  const selectedDay = useMemo(
    () => days.find((d) => d.date === selectedDate) ?? days[0],
    [days, selectedDate],
  );

  const checkedCount = useMemo(
    () => shopping.filter((i) => i.checked).length,
    [shopping],
  );

  const dayCalories = useMemo(
    () => (selectedDay ? sumDayCalories(selectedDay, getRecipe) : 0),
    [selectedDay, getRecipe],
  );

  const jumpToToday = useCallback(async () => {
    if (days.some((d) => d.date === today)) {
      setSelectedDate(today);
      return;
    }
    if (!plan) return;
    const planMonday = startOfWeekLocal(new Date(plan.weekStart));
    const thisMonday = startOfWeekLocal(new Date());
    const offsetWeeks = Math.round(
      (thisMonday.getTime() - planMonday.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    await changeWeek(offsetWeeks);
    setSelectedDate(today);
  }, [days, today, plan, changeWeek]);

  const autoFillWeek = useCallback(async () => {
    if (recipes.length === 0) return;
    for (const day of days) {
      for (const slot of ['breakfast', 'lunch', 'dinner'] as MealSlot[]) {
        if (!day.meals[slot]) {
          const recipe = pickRandom(recipes);
          if (recipe) await assignMeal(day.date, slot, recipe.id);
        }
      }
    }
  }, [days, recipes, assignMeal]);

  const clearWeek = useCallback(() => {
    Alert.alert('ล้างแพนสัปดาห์นี้', 'ลบเมนูทุกมื้อในสัปดาห์ที่แสดง?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ล้าง',
        style: 'destructive',
        onPress: async () => {
          for (const day of days) {
            for (const slot of ['breakfast', 'lunch', 'dinner'] as MealSlot[]) {
              if (day.meals[slot]) await assignMeal(day.date, slot, undefined);
            }
          }
        },
      },
    ]);
  }, [days, assignMeal]);

  const randomizeSlot = useCallback(
    async (date: string, slot: MealSlot) => {
      const recipe = pickRandom(recipes);
      if (recipe) await assignMeal(date, slot, recipe.id);
    },
    [recipes, assignMeal],
  );

  const openMealMenu = useCallback(
    (date: string, slot: MealSlot, recipeId: string) => {
      Alert.alert(SLOT_LABELS[slot], undefined, [
        { text: 'เปลี่ยนเมนู', onPress: () => setPicker({ date, slot }) },
        {
          text: 'เปิดสูตร',
          onPress: () => router.push(`/recipe/${recipeId}`),
        },
        {
          text: 'ลบออกจากแพลน',
          style: 'destructive',
          onPress: () => assignMeal(date, slot, undefined),
        },
        { text: 'ยกเลิก', style: 'cancel' },
      ]);
    },
    [assignMeal],
  );

  const weekLabel = useMemo(() => {
    if (days.length === 0) return '';
    const start = days[0].date;
    const end = days[days.length - 1].date;
    const fmt = (iso: string) => {
      const d = new Date(iso);
      return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    };
    return `สัปดาห์ ${fmt(start)} – ${fmt(end)}`;
  }, [days]);

  const shoppingMissing = shopping.filter((i) => !i.checked).length;

  return (
    <ScreenShell>
      <FloatingHeader
        segments={[
          { id: 'plan', label: 'แพลนมื้อ' },
          { id: 'shop', label: 'ซื้อของ' },
        ]}
        activeSegmentId={section}
        onSegmentPress={(id) => setSection(id as 'plan' | 'shop')}
        actions={[
          {
            icon: 'sparkles-outline',
            accessibilityLabel: 'สุ่มเติมแพลนทั้งสัปดาห์',
            onPress: () => {
              Alert.alert('สุ่มเติมแพลน', 'เติมเมนูสุ่มในช่องว่างทุกมื้อของสัปดาห์นี้?', [
                { text: 'ยกเลิก', style: 'cancel' },
                { text: 'เติมเลย', onPress: () => autoFillWeek() },
              ]);
            },
          },
          {
            icon: 'trash-outline',
            accessibilityLabel: 'ล้างแพลนสัปดาห์',
            onPress: clearWeek,
          },
          {
            icon: 'refresh',
            accessibilityLabel: 'รีเฟรชรายการซื้อของ',
            onPress: () => rebuildShoppingList(),
          },
        ]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerClearance,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: spacing.md,
        }}
      >
        {section === 'plan' && (
          <>
            <AppText variant="caption" muted style={styles.weekTitle}>{weekLabel}</AppText>
            <AppText variant="heading" style={styles.plannerHeading}>แพลนมื้อ</AppText>
            <View style={styles.weekNav}>
              <Pressable onPress={() => changeWeek(-1)} hitSlop={8} accessibilityLabel="สัปดาห์ก่อน">
                <Ionicons name="chevron-back" size={24} color={colors.ink} />
              </Pressable>
              <Pressable onPress={jumpToToday} style={styles.todayBtn}>
                <AppText variant="label" style={styles.todayBtnText}>วันนี้</AppText>
              </Pressable>
              <Pressable onPress={() => changeWeek(1)} hitSlop={8} accessibilityLabel="สัปดาห์ถัดไป">
                <Ionicons name="chevron-forward" size={24} color={colors.ink} />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weekStrip}
            >
              {days.map((day, idx) => {
                const isToday = day.date === today;
                const isSelected = day.date === selectedDate;
                const dayNum = day.date.slice(8, 10);
                return (
                  <Pressable
                    key={day.date}
                    onPress={() => setSelectedDate(day.date)}
                    style={[
                      styles.dayChip,
                      isSelected && styles.dayChipSelected,
                      isSelected && accentGlow(colors),
                      isToday && !isSelected && styles.dayChipToday,
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={{
                        color: isSelected ? colors.white : colors.inkMuted,
                        fontFamily: fonts.medium,
                      }}
                    >
                      {DAY_LABELS[idx]}
                    </AppText>
                    <AppText
                      variant="label"
                      style={{
                        color: isSelected ? colors.white : colors.ink,
                        fontFamily: fonts.semiBold,
                      }}
                    >
                      {dayNum}
                    </AppText>
                    {dayHasMeals(day) && (
                      <View
                        style={[
                          styles.dayDot,
                          { backgroundColor: isSelected ? colors.white : colors.orange },
                        ]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {selectedDay && (
              <View style={styles.dayPanel}>
                <View style={styles.dayPanelHeader}>
                  <AppText variant="title">
                    {DAY_LABELS[days.indexOf(selectedDay)]} {selectedDay.date.slice(5).replace('-', '/')}
                  </AppText>
                  {isTodaySelected(selectedDay.date, today) && (
                    <View style={styles.todayPill}>
                      <AppText variant="caption" style={styles.todayPillText}>วันนี้</AppText>
                    </View>
                  )}
                </View>

                <View style={[styles.kcalCard, accentGlow(colors, false)]}>
                  <View style={styles.kcalTopRow}>
                    <AppText variant="caption" muted>
                      วันนี้ · {selectedDay.date.slice(8, 10)} {selectedDay.date.slice(5, 7)}
                    </AppText>
                    <AppText variant="caption" style={styles.kcalGoal}>เป้า 1,800</AppText>
                  </View>
                  <AppText variant="title" style={styles.kcalValue}>
                    {dayCalories > 0 ? `${dayCalories.toLocaleString()} kcal` : '—'}
                  </AppText>
                  <View style={styles.kcalBarBg}>
                    <View
                      style={[
                        styles.kcalBarFill,
                        { width: `${Math.min(100, (dayCalories / 1800) * 100)}%` },
                      ]}
                    />
                  </View>
                </View>

                {(['breakfast', 'lunch', 'dinner'] as MealSlot[]).map((slot) => {
                  const rid = selectedDay.meals[slot];
                  const recipe = rid ? getRecipe(rid) : undefined;
                  return (
                    <View key={slot} style={styles.slotSection}>
                      <View style={styles.slotHeading}>
                        <View style={styles.timelineDot} />
                        <Ionicons name={SLOT_ICONS[slot]} size={18} color={colors.orange} />
                        <AppText variant="label">{SLOT_LABELS[slot]}</AppText>
                      </View>
                      {recipe ? (
                        <FilledMealCard
                          recipe={recipe}
                          fridgeItems={fridgeItems}
                          onPress={() => router.push(`/recipe/${recipe.id}`)}
                          onMenu={() => openMealMenu(selectedDay.date, slot, recipe.id)}
                        />
                      ) : (
                        <EmptyMealCard
                          slot={slot}
                          onAdd={() => setPicker({ date: selectedDay.date, slot })}
                          onShuffle={() => randomizeSlot(selectedDay.date, slot)}
                        />
                      )}
                    </View>
                  );
                })}

                <Pressable style={[styles.shopCta, accentGlow(colors, false)]} onPress={() => setSection('shop')}>
                  <View style={styles.shopCtaIcon}>
                    <Ionicons name="basket-outline" size={22} color={colors.orange} />
                  </View>
                  <View style={styles.shopCtaText}>
                    <AppText variant="label">สร้างรายการซื้อของจากแผนสัปดาห์</AppText>
                    <AppText variant="caption" muted>
                      ขาด {shoppingMissing} อย่าง · เทียบกับของในตู้เย็น
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.inkMuted} />
                </Pressable>
              </View>
            )}
          </>
        )}

        {section === 'shop' && (
          <View style={styles.shopSection}>
            <View style={styles.shopHeader}>
              <AppText variant="title">รายการซื้อของ</AppText>
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
        )}

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
                    <RecipeCoverImage recipe={r} style={styles.pickThumb} rounded={radius.sm} iconSize={20} />
                    <AppText style={styles.pickTitle} numberOfLines={2}>{r.title}</AppText>
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
    </ScreenShell>
  );
}

function isTodaySelected(date: string, today: string): boolean {
  return date === today;
}

function FilledMealCard({
  recipe,
  fridgeItems,
  onPress,
  onMenu,
}: {
  recipe: Recipe;
  fridgeItems: Parameters<typeof matchRecipeToFridge>[1];
  onPress: () => void;
  onMenu: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const cal = parseRecipeCalories(recipe);
  const mins = totalMinutes(recipe);
  const match = fridgeItems.length > 0 ? matchRecipeToFridge(recipe, fridgeItems) : null;
  const percent = match?.percent ?? 0;

  return (
    <View style={styles.filledCard}>
      <Pressable style={styles.filledMain} onPress={onPress}>
        <RecipeCoverImage recipe={recipe} style={styles.mealThumb} rounded={radius.md} iconSize={22} />
        <View style={styles.filledBody}>
          <AppText variant="label" numberOfLines={2}>{recipe.title}</AppText>
          <AppText variant="caption" muted>
            {mins} น.{cal != null ? ` · ${cal} kcal` : ''}
          </AppText>
          {match && fridgeItems.length > 0 && (
            <View style={styles.miniMatch}>
              <View style={styles.miniProgressBg}>
                <View
                  style={[
                    styles.miniProgressFill,
                    { width: `${percent}%`, backgroundColor: fridgeProgressColor(percent, colors) },
                  ]}
                />
              </View>
              <AppText variant="caption" style={styles.miniMatchText}>มีในตู้ {percent}%</AppText>
            </View>
          )}
        </View>
      </Pressable>
      <Pressable onPress={onMenu} hitSlop={10} accessibilityLabel="เมนูมื้อนี้">
        <Ionicons name="ellipsis-horizontal" size={22} color={colors.inkMuted} />
      </Pressable>
    </View>
  );
}

const EMPTY_SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'เพิ่มเมนูมื้อเช้า',
  lunch: 'เพิ่มเมนูมื้อกลางวัน',
  dinner: 'เพิ่มเมนูมื้อเย็น',
};

function EmptyMealCard({
  slot,
  onAdd,
  onShuffle,
}: {
  slot: MealSlot;
  onAdd: () => void;
  onShuffle: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.emptyMealRow}>
      <Pressable style={styles.emptyMealCardDashed} onPress={onAdd}>
        <Ionicons name="add-circle-outline" size={22} color={colors.orange} />
        <AppText variant="label" style={{ color: colors.orange }}>{EMPTY_SLOT_LABEL[slot]}</AppText>
        <AppText variant="caption" muted>เลือกจากสูตร หรือกดสุ่ม</AppText>
      </Pressable>
      <Pressable style={styles.shuffleMini} onPress={onShuffle} accessibilityLabel="สุ่มเมนู">
        <Ionicons name="dice-outline" size={20} color={colors.orange} />
        <AppText variant="caption" style={{ color: colors.orange, fontFamily: fonts.semiBold }}>
          สุ่ม
        </AppText>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  weekTitle: { marginBottom: 4 },
  plannerHeading: { fontSize: 26, marginBottom: spacing.md, lineHeight: 32 },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.orange,
  },
  kcalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  kcalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kcalGoal: { color: colors.orange, fontFamily: fonts.semiBold },
  kcalValue: { fontSize: 24, lineHeight: 30 },
  shopCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kcalBarBg: {
    height: 6,
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  kcalBarFill: {
    height: 6,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
  },
  shopCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shopCtaText: { flex: 1, gap: 2 },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  todayBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  todayBtnText: { color: colors.orange, fontFamily: fonts.semiBold },
  weekStrip: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingRight: spacing.sm,
  },
  dayChip: {
    width: 52,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  dayChipSelected: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  dayChipToday: {
    borderColor: colors.orange,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  dayPanel: { marginTop: spacing.xs },
  dayPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  todayPill: {
    backgroundColor: colors.warningBanner,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  todayPillText: { fontFamily: fonts.semiBold, color: colors.ink },
  slotSection: { marginBottom: spacing.md },
  slotHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filledCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingRight: spacing.sm,
    minHeight: 88,
    flexShrink: 0,
  },
  filledMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.sm,
    minWidth: 0,
  },
  mealThumb: { width: 72, height: 72, flexShrink: 0 },
  filledBody: { flex: 1, gap: 4, minWidth: 0 },
  miniMatch: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  miniProgressBg: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    maxWidth: 80,
  },
  miniProgressFill: { height: 4, borderRadius: 2 },
  miniMatchText: { fontFamily: fonts.medium, fontSize: 11 },
  emptyMealRow: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm },
  emptyMealCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  emptyMealCardDashed: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.orange,
    backgroundColor: colors.white,
  },
  shuffleMini: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calSummary: { textAlign: 'center', marginTop: spacing.sm },
  shopSection: { marginTop: spacing.sm },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickThumb: { width: 48, height: 48 },
  pickTitle: { flex: 1, fontFamily: fonts.medium },
  clearMeal: { marginTop: spacing.md, alignItems: 'center' },
});
