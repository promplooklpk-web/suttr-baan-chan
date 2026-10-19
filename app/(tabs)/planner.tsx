import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { ConfirmModal } from '@/components/ConfirmModal';
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
import { useSnackbar } from '@/context/SnackbarContext';
import { loadAppSettings } from '@/lib/appSettings';
import { defaultExpiryForPlace } from '@/lib/catalogDefaults';
import {
  SHOPPING_GROUP_LABELS,
  SHOPPING_GROUP_ORDER,
  shoppingGroupForName,
} from '@/lib/shoppingGroups';
import { fridgeProgressColor } from '@/lib/fridgeMatchDisplay';
import { matchRecipeToFridge } from '@/lib/fridgeMatch';
import { pickRandom } from '@/lib/pickerHistory';
import { parseRecipeCalories } from '@/lib/recipeMedia';
import { totalMinutes } from '@/lib/storage';
import type { MealPlanDay } from '@/types/mealPlan';
import type { MealSlot } from '@/types/mealPlan';
import type { Recipe } from '@/types/recipe';
import {
  parseLocalDateIso,
  startOfWeekMondayLocal,
  thaiPlannerDayLabel,
  todayLocalIso,
} from '@/utils/localDate';

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'เช้า',
  lunch: 'กลางวัน',
  dinner: 'เย็น',
};

const SLOT_TIMES: Record<MealSlot, string> = {
  breakfast: '07:30',
  lunch: '12:30',
  dinner: '18:30',
};

const SLOT_ICONS: Record<MealSlot, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
};

const DAY_LABELS = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];

function todayIso(): string {
  return todayLocalIso();
}

function startOfWeekLocal(d: Date): Date {
  return startOfWeekMondayLocal(d);
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
  const {
    plan,
    shopping,
    assignMeal,
    toggleMealDone,
    changeWeek,
    toggleShoppingItem,
    rebuildShoppingList,
    repeatMealWeekdays,
    copyMeal,
    addManualShopping,
    clearPurchasedShopping,
    takeCheckedForFridge,
  } = useMealPlan();
  const { recipes, getRecipe } = useRecipes();
  const { items: fridgeItems, addItem } = useFridge();
  const { showSnackbar } = useSnackbar();
  const [picker, setPicker] = useState<{ date: string; slot: MealSlot } | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualAddOpen, setManualAddOpen] = useState(false);
  const [confirmClearWeek, setConfirmClearWeek] = useState(false);
  const [mealMenu, setMealMenu] = useState<{
    date: string;
    slot: MealSlot;
    recipeId: string;
  } | null>(null);
  const [copyMealSource, setCopyMealSource] = useState<{
    fromDate: string;
    fromSlot: MealSlot;
  } | null>(null);
  const [copyTargetDate, setCopyTargetDate] = useState('');
  const [copyTargetSlot, setCopyTargetSlot] = useState<MealSlot>('lunch');
  const [kcalGoal, setKcalGoal] = useState(1800);
  const params = useLocalSearchParams<{ section?: string }>();
  const [section, setSection] = useState<'plan' | 'shop'>(
    params.section === 'shop' ? 'shop' : 'plan',
  );
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const headerClearance = floatingHeaderClearance(insets.top);

  useEffect(() => {
    loadAppSettings().then((s) => setKcalGoal(s.dailyKcalGoal));
  }, []);

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

  const weekHasAnyMeal = useMemo(() => days.some(dayHasMeals), [days]);

  const groupedShopping = useMemo(() => {
    const groups = new Map<string, typeof shopping>();
    for (const item of shopping) {
      const g = shoppingGroupForName(item.name);
      const list = groups.get(g) ?? [];
      list.push(item);
      groups.set(g, list);
    }
    return groups;
  }, [shopping]);

  const moveCheckedToFridge = useCallback(async () => {
    const taken = await takeCheckedForFridge();
    if (taken.length === 0) {
      showSnackbar('ยังไม่ได้ติ๊กรายการที่ซื้อแล้ว');
      return;
    }
    for (const row of taken) {
      await addItem({
        name: row.name,
        quantity: row.amount ?? 1,
        unit: row.unit ?? 'กรัม',
        place: 'chilled',
        expiresAt: defaultExpiryForPlace('chilled'),
      });
    }
    await rebuildShoppingList();
    showSnackbar(`ย้าย ${taken.length} รายการเข้าตู้เย็น`);
  }, [takeCheckedForFridge, addItem, rebuildShoppingList, showSnackbar]);

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
    setConfirmClearWeek(true);
  }, []);

  const runClearWeek = useCallback(async () => {
    for (const day of days) {
      for (const slot of ['breakfast', 'lunch', 'dinner'] as MealSlot[]) {
        if (day.meals[slot]) await assignMeal(day.date, slot, undefined);
      }
    }
    setConfirmClearWeek(false);
    showSnackbar('ล้างแพลนสัปดาห์นี้แล้ว');
  }, [days, assignMeal, showSnackbar]);

  const randomizeSlot = useCallback(
    async (date: string, slot: MealSlot) => {
      const recipe = pickRandom(recipes);
      if (recipe) await assignMeal(date, slot, recipe.id);
    },
    [recipes, assignMeal],
  );

  const openMealMenu = useCallback((date: string, slot: MealSlot, recipeId: string) => {
    setMealMenu({ date, slot, recipeId });
  }, []);

  const openCopyMealSheet = useCallback((fromDate: string, fromSlot: MealSlot) => {
    setCopyMealSource({ fromDate, fromSlot });
    setCopyTargetDate(fromDate);
    setCopyTargetSlot(fromSlot);
    setMealMenu(null);
  }, []);

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
        actions={
          section === 'plan'
            ? [
                {
                  icon: 'sparkles-outline',
                  accessibilityLabel: 'สุ่มเติมแพลนทั้งสัปดาห์',
                  onPress: async () => {
                    await autoFillWeek();
                    showSnackbar('เติมแพลนสัปดาห์แล้ว');
                  },
                },
                {
                  icon: 'trash-outline',
                  accessibilityLabel: 'ล้างแพลนสัปดาห์',
                  onPress: clearWeek,
                },
              ]
            : [
                {
                  icon: 'add-circle-outline',
                  accessibilityLabel: 'เพิ่มรายการเอง',
                  onPress: () => setManualAddOpen(true),
                },
                {
                  icon: 'archive-outline',
                  accessibilityLabel: 'ล้างที่ซื้อแล้ว',
                  onPress: async () => {
                    const n = shopping.filter((i) => i.checked).length;
                    if (n === 0) {
                      showSnackbar('ยังไม่มีรายการที่ติ๊กแล้ว');
                      return;
                    }
                    await clearPurchasedShopping();
                    showSnackbar(`ล้างรายการที่ซื้อแล้ว ${n} รายการ`);
                  },
                },
                {
                  icon: 'snow-outline',
                  accessibilityLabel: 'ย้ายที่ติ๊กแล้วเข้าตู้เย็น',
                  onPress: () => moveCheckedToFridge(),
                },
                {
                  icon: 'refresh',
                  accessibilityLabel: 'รีเฟรชรายการซื้อของ',
                  onPress: async () => {
                    await rebuildShoppingList();
                    showSnackbar('อัปเดตรายการซื้อของแล้ว');
                  },
                },
              ]
        }
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
            {!weekHasAnyMeal && (
              <View style={styles.emptyWeek}>
                <AppText variant="label" muted>สัปดาห์นี้ยังไม่มีเมนู</AppText>
                <Pressable
                  style={[styles.emptyWeekBtn, accentGlow(colors, false)]}
                  onPress={async () => {
                    await autoFillWeek();
                    showSnackbar('สุ่มทั้งสัปดาห์แล้ว');
                  }}
                >
                  <Ionicons name="dice-outline" size={20} color={colors.orange} />
                  <AppText variant="label" style={{ color: colors.orange }}>สุ่มทั้งสัปดาห์</AppText>
                </Pressable>
              </View>
            )}

            <View style={styles.weekNav}>
              <Pressable onPress={() => changeWeek(-1)} style={styles.navHit} accessibilityLabel="สัปดาห์ก่อน">
                <Ionicons name="chevron-back" size={24} color={colors.ink} />
              </Pressable>
              <Pressable onPress={jumpToToday} style={styles.todayBtn}>
                <AppText variant="label" style={styles.todayBtnText}>วันนี้</AppText>
              </Pressable>
              <Pressable onPress={() => changeWeek(1)} style={styles.navHit} accessibilityLabel="สัปดาห์ถัดไป">
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
                const kcal = sumDayCalories(day, getRecipe);
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
                        color: isSelected ? colors.surface : colors.inkMuted,
                        fontFamily: fonts.medium,
                      }}
                    >
                      {DAY_LABELS[idx]}
                    </AppText>
                    <AppText
                      variant="label"
                      style={{
                        color: isSelected ? colors.surface : colors.ink,
                        fontFamily: fonts.semiBold,
                      }}
                    >
                      {dayNum}
                    </AppText>
                    {kcal > 0 ? (
                      <AppText
                        variant="caption"
                        style={{
                          fontSize: 9,
                          color: isSelected ? colors.surface : colors.inkMuted,
                          fontFamily: fonts.medium,
                        }}
                      >
                        {kcal}
                      </AppText>
                    ) : dayHasMeals(day) ? (
                      <View
                        style={[
                          styles.dayDot,
                          { backgroundColor: isSelected ? colors.surface : colors.orange },
                        ]}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            {selectedDay && (
              <View style={styles.dayPanel}>
                <View style={styles.dayPanelHeader}>
                  <AppText variant="title">
                    {thaiPlannerDayLabel(selectedDay.date)}
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
                      วันนี้ · {thaiPlannerDayLabel(selectedDay.date)}
                    </AppText>
                    <AppText variant="caption" style={styles.kcalGoal}>
                      เป้า {kcalGoal.toLocaleString()}
                    </AppText>
                  </View>
                  <AppText variant="title" style={styles.kcalValue}>
                    {dayCalories > 0 ? `${dayCalories.toLocaleString()} kcal` : '—'}
                  </AppText>
                  <View style={styles.kcalBarBg}>
                    <View
                      style={[
                        styles.kcalBarFill,
                        { width: `${Math.min(100, kcalGoal > 0 ? (dayCalories / kcalGoal) * 100 : 0)}%` },
                      ]}
                    />
                  </View>
                </View>

                {(['breakfast', 'lunch', 'dinner'] as MealSlot[]).map((slot) => {
                  const rid = selectedDay.meals[slot];
                  const recipe = rid ? getRecipe(rid) : undefined;
                  return (
                    <View key={slot} style={styles.slotSection}>
                      <View style={styles.slotHeadingRow}>
                        <View style={styles.slotHeading}>
                          <View style={styles.timelineDot} />
                          <Ionicons name={SLOT_ICONS[slot]} size={18} color={colors.orange} />
                          <AppText variant="label">
                            {SLOT_LABELS[slot]} {SLOT_TIMES[slot]}
                          </AppText>
                        </View>
                        {recipe && parseRecipeCalories(recipe) != null && (
                          <AppText variant="caption" muted>
                            {parseRecipeCalories(recipe)} kcal
                          </AppText>
                        )}
                      </View>
                      {recipe ? (
                        <FilledMealCard
                          recipe={recipe}
                          fridgeItems={fridgeItems}
                          done={selectedDay.done?.[slot] === true}
                          onToggleDone={() => toggleMealDone(selectedDay.date, slot)}
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
              {checkedCount}/{shopping.length} รายการ · จากแพลนลบของในตู้เย็น
            </AppText>
            {shopping.length === 0 ? (
              <AppText muted style={{ textAlign: 'center', marginTop: spacing.lg }}>
                ยังไม่มีของต้องซื้อ — ลองเพิ่มเมนูในแพลนหรือกดเพิ่มเอง
              </AppText>
            ) : (
              SHOPPING_GROUP_ORDER.map((groupId) => {
                const items = groupedShopping.get(groupId);
                if (!items?.length) return null;
                return (
                  <View key={groupId} style={styles.shopGroup}>
                    <AppText variant="label" style={styles.shopGroupTitle}>
                      {SHOPPING_GROUP_LABELS[groupId]}
                    </AppText>
                    {items.map((item) => (
                      <Pressable
                        key={item.id}
                        style={styles.shopRow}
                        onPress={() => toggleShoppingItem(item.id)}
                      >
                        <View style={styles.shopCheckHit}>
                          <Ionicons
                            name={item.checked ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={item.checked ? colors.orange : colors.inkMuted}
                          />
                        </View>
                        <AppText style={[styles.shopName, item.checked && styles.shopChecked]}>
                          {item.name}
                          {item.manual ? ' · เพิ่มเอง' : ''}
                        </AppText>
                        <AppText muted>
                          {[item.amount, item.unit].filter(Boolean).join(' ')}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                );
              })
            )}
            {checkedCount > 0 && (
              <Pressable style={styles.shopSecondaryBtn} onPress={() => moveCheckedToFridge()}>
                <AppText variant="label" style={{ color: colors.orange }}>
                  ย้ายที่ติ๊กแล้วเข้าตู้เย็น
                </AppText>
              </Pressable>
            )}
          </View>
        )}

        <ConfirmModal
          visible={confirmClearWeek}
          title="ล้างแพลนสัปดาห์นี้"
          message="ลบเมนูทุกมื้อในสัปดาห์ที่แสดง?"
          confirmLabel="ล้าง"
          destructive
          onCancel={() => setConfirmClearWeek(false)}
          onConfirm={() => void runClearWeek()}
        />

        <Modal visible={mealMenu != null} transparent animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setMealMenu(null)}>
            <View style={styles.modalSheet}>
              {mealMenu && (
                <>
                  <AppText variant="title" style={{ marginBottom: spacing.md }}>
                    {SLOT_LABELS[mealMenu.slot]}
                  </AppText>
                  <Pressable
                    style={styles.menuRow}
                    onPress={() => {
                      setPicker({ date: mealMenu.date, slot: mealMenu.slot });
                      setMealMenu(null);
                    }}
                  >
                    <AppText variant="label">เปลี่ยนเมนู</AppText>
                  </Pressable>
                  <Pressable
                    style={styles.menuRow}
                    onPress={() => {
                      router.push(`/recipe/${mealMenu.recipeId}`);
                      setMealMenu(null);
                    }}
                  >
                    <AppText variant="label">เปิดสูตร</AppText>
                  </Pressable>
                  <Pressable
                    style={styles.menuRow}
                    onPress={() => openCopyMealSheet(mealMenu.date, mealMenu.slot)}
                  >
                    <AppText variant="label">คัดลอกไปวัน/มื้ออื่น</AppText>
                  </Pressable>
                  <Pressable
                    style={styles.menuRow}
                    onPress={async () => {
                      const { date, slot } = mealMenu;
                      await repeatMealWeekdays(date, slot, [0, 1, 2, 3, 4]);
                      setMealMenu(null);
                      showSnackbar('คัดลอกเมนูไปวันจันทร์–ศุกร์');
                    }}
                  >
                    <AppText variant="label">ทำซ้ำ จ–ศ</AppText>
                  </Pressable>
                  <Pressable
                    style={styles.menuRow}
                    onPress={async () => {
                      const { date, slot, recipeId } = mealMenu;
                      await assignMeal(date, slot, undefined);
                      setMealMenu(null);
                      showSnackbar('ลบออกจากแพลนแล้ว', async () => {
                        await assignMeal(date, slot, recipeId);
                      });
                    }}
                  >
                    <AppText variant="label" style={{ color: colors.danger }}>ลบออกจากแพลน</AppText>
                  </Pressable>
                  <Pressable onPress={() => setMealMenu(null)} style={styles.menuCancel}>
                    <AppText muted style={{ textAlign: 'center' }}>ปิด</AppText>
                  </Pressable>
                </>
              )}
            </View>
          </Pressable>
        </Modal>

        <Modal visible={copyMealSource != null} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <AppText variant="title" style={{ marginBottom: spacing.sm }}>คัดลอกไปวัน/มื้อ</AppText>
              <AppText variant="caption" muted style={{ marginBottom: spacing.md }}>
                เลือกวันและมื้อปลายทาง
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                <View style={styles.copyDayRow}>
                  {days.map((day, idx) => {
                    const selected = day.date === copyTargetDate;
                    return (
                      <Pressable
                        key={day.date}
                        onPress={() => setCopyTargetDate(day.date)}
                        style={[styles.copyDayChip, selected && styles.copyDayChipOn]}
                      >
                        <AppText variant="caption" style={{ color: selected ? colors.surface : colors.inkMuted }}>
                          {DAY_LABELS[idx]}
                        </AppText>
                        <AppText variant="label" style={{ color: selected ? colors.surface : colors.ink }}>
                          {day.date.slice(8, 10)}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
              <View style={styles.copySlotRow}>
                {(['breakfast', 'lunch', 'dinner'] as MealSlot[]).map((slot) => {
                  const on = copyTargetSlot === slot;
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => setCopyTargetSlot(slot)}
                      style={[styles.copySlotBtn, on && styles.copySlotBtnOn]}
                    >
                      <AppText variant="label" style={{ color: on ? colors.surface : colors.ink }}>
                        {SLOT_LABELS[slot]}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                style={styles.manualSave}
                onPress={async () => {
                  if (!copyMealSource || !copyTargetDate) return;
                  await copyMeal(
                    copyMealSource.fromDate,
                    copyMealSource.fromSlot,
                    copyTargetDate,
                    copyTargetSlot,
                  );
                  setCopyMealSource(null);
                  showSnackbar('คัดลอกเมนูแล้ว');
                }}
              >
                <AppText style={{ color: colors.onAccent, fontFamily: fonts.semiBold, textAlign: 'center' }}>
                  คัดลอก
                </AppText>
              </Pressable>
              <Pressable onPress={() => setCopyMealSource(null)}>
                <AppText muted style={{ textAlign: 'center', marginTop: spacing.md }}>ยกเลิก</AppText>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={manualAddOpen} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <AppText variant="title" style={{ marginBottom: spacing.md }}>เพิ่มรายการเอง</AppText>
              <TextInput
                value={manualName}
                onChangeText={setManualName}
                placeholder="ชื่อของ เช่น นมสด"
                placeholderTextColor={colors.inkMuted}
                style={styles.manualInput}
              />
              <Pressable
                style={styles.manualSave}
                onPress={async () => {
                  const name = manualName.trim();
                  if (!name) return;
                  await addManualShopping(name);
                  setManualName('');
                  setManualAddOpen(false);
                  showSnackbar(`เพิ่ม "${name}" ในรายการซื้อ`);
                }}
              >
                <AppText style={{ color: colors.onAccent, fontFamily: fonts.semiBold }}>เพิ่ม</AppText>
              </Pressable>
              <Pressable onPress={() => setManualAddOpen(false)}>
                <AppText muted style={{ textAlign: 'center', marginTop: spacing.md }}>ปิด</AppText>
              </Pressable>
            </View>
          </View>
        </Modal>

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
  done,
  onToggleDone,
  onPress,
  onMenu,
}: {
  recipe: Recipe;
  fridgeItems: Parameters<typeof matchRecipeToFridge>[1];
  done: boolean;
  onToggleDone: () => void;
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
      <View style={styles.filledActions}>
        <Pressable onPress={onMenu} style={styles.iconHit} accessibilityLabel="เมนูมื้อนี้">
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.inkMuted} />
        </Pressable>
        <Pressable
          onPress={onToggleDone}
          accessibilityLabel={done ? 'ทำมื้อนี้แล้ว' : 'ยังไม่ทำมื้อนี้'}
          style={[styles.doneCircle, done && styles.doneCircleOn]}
        >
          {done ? (
            <Ionicons name="checkmark" size={18} color={colors.surface} />
          ) : null}
        </Pressable>
      </View>
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shopCtaText: { flex: 1, gap: 2 },
  emptyWeek: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyWeekBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  navHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
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
  slotHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  slotHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  filledActions: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  iconHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCircleOn: {
    backgroundColor: colors.cardGreen,
    borderColor: colors.cardGreen,
  },
  filledCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
  },
  shuffleMini: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calSummary: { textAlign: 'center', marginTop: spacing.sm },
  shopGroup: { marginBottom: spacing.md },
  shopGroupTitle: { marginBottom: spacing.xs, color: colors.orange },
  shopCheckHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopSecondaryBtn: {
    marginTop: spacing.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  manualInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: fonts.regular,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  manualSave: {
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  menuRow: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuCancel: { marginTop: spacing.md, minHeight: 44, justifyContent: 'center' },
  copyDayRow: { flexDirection: 'row', gap: spacing.sm },
  copyDayChip: {
    width: 52,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copyDayChipOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  copySlotRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  copySlotBtn: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  copySlotBtnOn: { backgroundColor: colors.orange, borderColor: colors.orange },
});
