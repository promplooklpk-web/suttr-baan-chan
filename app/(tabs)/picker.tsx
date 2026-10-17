import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { FloatingHeader, floatingHeaderClearance } from '@/components/FloatingHeader';
import {
  PickerFilterSheet,
  type PickerCategoryFilter,
} from '@/components/picker/PickerFilterSheet';
import { RecipeCoverImage } from '@/components/RecipeCoverImage';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useFridge } from '@/context/FridgeContext';
import { useMealPlan } from '@/context/MealPlanContext';
import { useRecipes } from '@/context/RecipesContext';
import { fridgeProgressColor } from '@/lib/fridgeMatchDisplay';
import { matchRecipeToFridge } from '@/lib/fridgeMatch';
import {
  loadPickerHistory,
  pickRandom,
  preferFreshPool,
  recordPickerPick,
  type PickerHistoryStore,
} from '@/lib/pickerHistory';
import { categoryChipLabel, parseRecipeCalories } from '@/lib/recipeMedia';
import { totalMinutes } from '@/lib/storage';
import type { FridgeItem } from '@/types/fridge';
import type { MealSlot } from '@/types/mealPlan';
import type { Recipe } from '@/types/recipe';

type Phase = 'idle' | 'shuffling' | 'result';

const MEAL_SHORT: Record<MealSlot, string> = {
  breakfast: 'เช้า',
  lunch: 'กลางวัน',
  dinner: 'เย็น',
};

function defaultMealSlot(): MealSlot {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  return 'dinner';
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function matchesCategory(recipe: Recipe, filter: PickerCategoryFilter): boolean {
  if (filter === 'ทั้งหมด') return true;
  if (filter === 'คลีน') {
    return recipe.category === 'อาหารคลีน' || recipe.tags?.includes('คลีน') === true;
  }
  return recipe.category === 'อาหารจานเดียว' || recipe.category === 'จานเดียว';
}

function filterPool(
  recipes: Recipe[],
  category: PickerCategoryFilter,
  maxMinutes: number | null,
  maxCalories: number | null,
): Recipe[] {
  return recipes.filter((r) => {
    if (!matchesCategory(r, category)) return false;
    const mins = totalMinutes(r);
    if (maxMinutes != null && mins > maxMinutes) return false;
    const cal = parseRecipeCalories(r);
    if (maxCalories != null && (cal == null || cal > maxCalories)) return false;
    return true;
  });
}

function countActiveFilters(
  category: PickerCategoryFilter,
  maxMinutes: number | null,
  maxCalories: number | null,
  prioritizeFridge: boolean,
): number {
  let n = 0;
  if (category !== 'ทั้งหมด') n += 1;
  if (maxMinutes != null) n += 1;
  if (maxCalories != null) n += 1;
  if (prioritizeFridge) n += 1;
  return n;
}

function fridgeWeightedPool(
  pool: Recipe[],
  fridgeItems: FridgeItem[],
  prioritize: boolean,
): Recipe[] {
  if (!prioritize || fridgeItems.length === 0) return pool;
  const scored = pool.map((r) => ({
    recipe: r,
    percent: matchRecipeToFridge(r, fridgeItems).percent,
  }));
  scored.sort((a, b) => b.percent - a.percent);
  const withStock = scored.filter((s) => s.percent > 0).map((s) => s.recipe);
  return withStock.length > 0 ? withStock : pool;
}

export default function PickerScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ autoShuffle?: string }>();
  const { recipes, toggleFavorite } = useRecipes();
  const { items: fridgeItems } = useFridge();
  const { assignMeal } = useMealPlan();

  const [category, setCategory] = useState<PickerCategoryFilter>('ทั้งหมด');
  const [maxMinutes, setMaxMinutes] = useState<number | null>(null);
  const [maxCalories, setMaxCalories] = useState<number | null>(null);
  const [prioritizeFridge, setPrioritizeFridge] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [meal, setMeal] = useState<MealSlot>(defaultMealSlot);
  const [history, setHistory] = useState<PickerHistoryStore>({});
  const [phase, setPhase] = useState<Phase>('idle');
  const [main, setMain] = useState<Recipe | null>(null);
  const [shufflePreview, setShufflePreview] = useState<Recipe | null>(null);
  const shuffleIndex = useRef(0);
  const autoShuffleDone = useRef(false);
  const shuffleScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadPickerHistory().then(setHistory);
  }, []);

  const pool = useMemo(
    () => filterPool(recipes, category, maxMinutes, maxCalories),
    [recipes, category, maxMinutes, maxCalories],
  );

  const weightedPool = useMemo(
    () => fridgeWeightedPool(pool, fridgeItems, prioritizeFridge),
    [pool, fridgeItems, prioritizeFridge],
  );

  const pickPool = useMemo(
    () => preferFreshPool(weightedPool, history),
    [weightedPool, history],
  );

  const idlePreview = useMemo(() => pickRandom(pool) ?? pickRandom(recipes), [pool, recipes]);

  const liveMain = useMemo(
    () => (main ? recipes.find((r) => r.id === main.id) ?? main : null),
    [main, recipes],
  );

  const displayRecipe =
    phase === 'shuffling' ? shufflePreview : phase === 'result' ? liveMain : idlePreview;

  const activeFilterCount = countActiveFilters(
    category,
    maxMinutes,
    maxCalories,
    prioritizeFridge,
  );

  const recentHistory = useMemo(() => {
    return Object.entries(history)
      .sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime())
      .slice(0, 10)
      .map(([id]) => recipes.find((r) => r.id === id))
      .filter((r): r is Recipe => r != null);
  }, [history, recipes]);

  useEffect(() => {
    if (main && !pool.some((r) => r.id === main.id)) {
      setMain(null);
      setPhase('idle');
    }
  }, [pool, main]);

  const pulseShuffle = useCallback(() => {
    Animated.sequence([
      Animated.timing(shuffleScale, { toValue: 0.94, duration: 90, useNativeDriver: true }),
      Animated.timing(shuffleScale, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [shuffleScale]);

  const finishPick = useCallback(
    async (recipe: Recipe) => {
      setMain(recipe);
      setPhase('result');
      pulseShuffle();
      await recordPickerPick(recipe.id);
      setHistory(await loadPickerHistory());
    },
    [pulseShuffle],
  );

  const startShuffle = useCallback(() => {
    if (pool.length === 0) {
      setMain(null);
      setPhase('idle');
      return;
    }
    pulseShuffle();
    setPhase('shuffling');
    shuffleIndex.current = 0;
    setShufflePreview(pickRandom(pool));
  }, [pool, pulseShuffle]);

  const stopShuffle = useCallback(() => {
    const chosen = pickRandom(pickPool) ?? pickRandom(pool);
    if (chosen) finishPick(chosen);
  }, [pickPool, pool, finishPick]);

  useEffect(() => {
    if (phase !== 'shuffling' || pool.length === 0) return;
    const timer = setInterval(() => {
      shuffleIndex.current += 1;
      setShufflePreview(pool[shuffleIndex.current % pool.length]);
    }, 90);
    return () => clearInterval(timer);
  }, [phase, pool]);

  useEffect(() => {
    if (params.autoShuffle === '1' && !autoShuffleDone.current && recipes.length > 0) {
      autoShuffleDone.current = true;
      startShuffle();
    }
  }, [params.autoShuffle, recipes.length, startShuffle]);

  const clearFilters = () => {
    setCategory('ทั้งหมด');
    setMaxMinutes(null);
    setMaxCalories(null);
    setPrioritizeFridge(false);
  };

  const saveToTodayPlan = async () => {
    const recipe = liveMain ?? main;
    if (!recipe) return;
    try {
      await assignMeal(todayIso(), meal, recipe.id);
      Alert.alert('บันทึกแล้ว', `เพิ่ม "${recipe.title}" ในแผน${MEAL_SHORT[meal]}วันนี้`);
    } catch (e) {
      Alert.alert('บันทึกไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    }
  };

  const empty = pool.length === 0;
  const headerClearance = floatingHeaderClearance(insets.top);
  const headerTitle = phase === 'shuffling' ? 'กำลังสุ่ม...' : 'กินอะไรดี';

  const onPrimaryPress = () => {
    if (phase === 'shuffling') stopShuffle();
    else startShuffle();
  };

  return (
    <View style={styles.screen}>
      <FloatingHeader
        title={headerTitle}
        actions={[
          {
            icon: 'calendar-outline',
            accessibilityLabel: 'แพลนมื้อ',
            onPress: () => router.push('/(tabs)/planner'),
          },
          {
            icon: 'settings-outline',
            accessibilityLabel: 'ตั้งค่า',
            onPress: () => router.push('/(tabs)/settings'),
          },
        ]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerClearance,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mealSegment}>
          {(['breakfast', 'lunch', 'dinner'] as MealSlot[]).map((slot) => (
            <Pressable
              key={slot}
              onPress={() => setMeal(slot)}
              style={[styles.mealSegBtn, meal === slot && styles.mealSegBtnOn]}
            >
              <AppText
                variant="label"
                style={{ color: meal === slot ? colors.white : colors.ink, fontSize: 14 }}
              >
                {MEAL_SHORT[slot]}
              </AppText>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.filterChip}
          onPress={() => setFilterOpen(true)}
          accessibilityLabel="ตัวกรอง"
        >
          <Ionicons name="options-outline" size={18} color={colors.ink} />
          <AppText variant="label">ตัวกรอง</AppText>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <AppText variant="caption" style={styles.filterBadgeText}>{activeFilterCount}</AppText>
            </View>
          )}
        </Pressable>

        {empty ? (
          <View style={styles.emptyCard}>
            <AppText variant="title" style={styles.emptyTitle}>ไม่มีเมนูตรงเงื่อนไข</AppText>
            <AppText muted style={styles.emptyBody}>
              ลองเปิดตัวกรองแล้วผ่อนเงื่อนไข หรือเพิ่มสูตรใหม่
            </AppText>
            <Pressable style={styles.clearBtn} onPress={clearFilters}>
              <AppText style={styles.clearBtnText}>รีเซ็ตตัวกรอง</AppText>
            </Pressable>
          </View>
        ) : (
          <>
            <Animated.View style={[styles.heroOuter, { transform: [{ scale: shuffleScale }] }]}>
              {displayRecipe ? (
                <HeroCard
                  recipe={displayRecipe}
                  meal={meal}
                  phase={phase}
                  fridgeItems={fridgeItems}
                  onFavorite={() => toggleFavorite(displayRecipe.id)}
                  onView={() => router.push(`/recipe/${displayRecipe.id}`)}
                  onSavePlan={saveToTodayPlan}
                  showActions={phase === 'result'}
                />
              ) : (
                <View style={styles.heroPlaceholder}>
                  <ActivityIndicator color={colors.orange} />
                </View>
              )}
            </Animated.View>

            <Pressable
              style={styles.shufflePrimary}
              onPress={onPrimaryPress}
              accessibilityLabel={phase === 'shuffling' ? 'หยุดสุ่ม' : 'สุ่มเมนู'}
            >
              <Ionicons
                name={phase === 'shuffling' ? 'hand-left-outline' : 'dice-outline'}
                size={24}
                color={colors.white}
              />
              <AppText style={styles.shufflePrimaryText}>
                {phase === 'shuffling' ? 'แตะเพื่อหยุด' : phase === 'result' ? 'สุ่มใหม่' : 'สุ่มเมนู'}
              </AppText>
            </Pressable>

            {phase === 'idle' && displayRecipe && (
              <AppText variant="caption" muted style={styles.previewHint}>
                ตัวอย่างจากสูตรของคุณ — กดสุ่มเพื่อเลือกเมนูจริง
              </AppText>
            )}

            <AppText variant="caption" muted style={styles.poolHint}>
              ตรงตัวกรอง {pool.length} จาก {recipes.length} สูตร · ไม่ซ้ำใน 3 วันที่ผ่านมา
            </AppText>
          </>
        )}

        {recentHistory.length > 0 && (
          <View style={styles.historySection}>
            <AppText variant="label" style={styles.historyTitle}>เมนูที่เพิ่งสุ่ม</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.historyRow}>
                {recentHistory.map((r) => (
                  <Pressable
                    key={r.id}
                    style={styles.historyThumb}
                    onPress={() => finishPick(r)}
                  >
                    <RecipeCoverImage recipe={r} style={styles.historyImage} rounded={radius.md} />
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <PickerFilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        category={category}
        onCategory={setCategory}
        maxMinutes={maxMinutes}
        onMaxMinutes={setMaxMinutes}
        maxCalories={maxCalories}
        onMaxCalories={setMaxCalories}
        prioritizeFridge={prioritizeFridge}
        onPrioritizeFridge={setPrioritizeFridge}
        fridgeAvailable={fridgeItems.length > 0}
        onReset={() => {
          clearFilters();
          setFilterOpen(false);
        }}
      />
    </View>
  );
}

function HeroCard({
  recipe,
  meal,
  phase,
  fridgeItems,
  onFavorite,
  onView,
  onSavePlan,
  showActions,
}: {
  recipe: Recipe;
  meal: MealSlot;
  phase: Phase;
  fridgeItems: FridgeItem[];
  onFavorite: () => void;
  onView: () => void;
  onSavePlan: () => void;
  showActions: boolean;
}) {
  const cal = parseRecipeCalories(recipe);
  const mins = totalMinutes(recipe);
  const category = categoryChipLabel(recipe.category);
  const match = fridgeItems.length > 0 ? matchRecipeToFridge(recipe, fridgeItems) : null;
  const percent = match?.percent ?? 0;

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroImageWrap}>
        <RecipeCoverImage recipe={recipe} style={styles.heroImage} rounded={radius.lg} />
        <View style={styles.heroOverlayTop} pointerEvents="none" />
        <View style={styles.heroOverlayBottom} pointerEvents="none" />
        <Pressable style={styles.favBtn} onPress={onFavorite}>
          <Ionicons
            name={recipe.isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={recipe.isFavorite ? colors.orange : colors.white}
          />
        </Pressable>
        {phase === 'shuffling' && (
          <View style={styles.shufflingBadge}>
            <AppText variant="caption" style={styles.shufflingBadgeText}>กำลังสุ่ม...</AppText>
          </View>
        )}
      </View>
      <View style={styles.heroBody}>
        <AppText variant="title" numberOfLines={2} style={styles.heroTitle}>
          {recipe.title}
        </AppText>
        <View style={styles.metaChips}>
          <MetaChip icon="time-outline" label={`${mins} น.`} />
          {cal != null && <MetaChip icon="flame-outline" label={`${cal} kcal`} />}
          <MetaChip label={category} />
        </View>
        {match && fridgeItems.length > 0 && (
          <View style={styles.matchBlock}>
            <AppText variant="caption" style={styles.matchLabel}>มีในตู้ {percent}%</AppText>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${percent}%`, backgroundColor: fridgeProgressColor(percent) },
                ]}
              />
            </View>
          </View>
        )}
        {showActions && (
          <View style={styles.heroActions}>
            <Pressable style={styles.secondaryAction} onPress={onView}>
              <AppText style={styles.secondaryActionText}>ดูสูตร</AppText>
            </Pressable>
            <Pressable style={styles.primaryAction} onPress={onSavePlan}>
              <AppText style={styles.primaryActionText}>เพิ่มในแผนมื้อ</AppText>
            </Pressable>
          </View>
        )}
        {!showActions && phase === 'idle' && (
          <AppText variant="caption" muted>
            มื้อ{MEAL_SHORT[meal]} · กดปุ่มสุ่มด้านล่างเพื่อเลือกเมนู
          </AppText>
        )}
      </View>
    </View>
  );
}

function MetaChip({ icon, label }: { icon?: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metaChip}>
      {icon ? <Ionicons name={icon} size={13} color={colors.inkMuted} /> : null}
      <AppText variant="caption" muted>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  mealSegment: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: spacing.md,
  },
  mealSegBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  mealSegBtnOn: {
    backgroundColor: colors.orange,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: { color: colors.white, fontFamily: fonts.semiBold, fontSize: 11 },
  heroOuter: { marginBottom: spacing.md },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#3A2A20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  heroImageWrap: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlayTop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(58,42,32,0.12)',
  },
  heroOverlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: 'rgba(58,42,32,0.5)',
  },
  favBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(58,42,32,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shufflingBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: colors.orange,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  shufflingBadgeText: { color: colors.white, fontFamily: fonts.semiBold },
  heroBody: { padding: spacing.md, gap: spacing.sm },
  heroTitle: { fontFamily: fonts.semiBold },
  metaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  matchBlock: { gap: 4, marginTop: spacing.xs },
  matchLabel: { fontFamily: fonts.semiBold, color: colors.ink },
  progressBg: {
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: 5, borderRadius: 3 },
  heroActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  secondaryAction: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  secondaryActionText: { fontFamily: fonts.semiBold, color: colors.ink },
  primaryAction: {
    flex: 1.2,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.orange,
    alignItems: 'center',
  },
  primaryActionText: { fontFamily: fonts.semiBold, color: colors.white },
  heroPlaceholder: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 24,
  },
  shufflePrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    marginBottom: spacing.sm,
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  shufflePrimaryText: { color: colors.white, fontFamily: fonts.semiBold, fontSize: 18 },
  previewHint: { textAlign: 'center', marginBottom: spacing.xs },
  poolHint: { textAlign: 'center', marginBottom: spacing.md },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  emptyTitle: { textAlign: 'center', marginBottom: spacing.sm },
  emptyBody: { textAlign: 'center', marginBottom: spacing.md },
  clearBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.orange,
  },
  clearBtnText: { color: colors.orange, fontFamily: fonts.semiBold },
  historySection: { marginTop: spacing.sm },
  historyTitle: { marginBottom: spacing.sm },
  historyRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.md },
  historyThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyImage: { width: 64, height: 64 },
});
