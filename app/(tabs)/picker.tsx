import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { screenTopPadding } from '@/lib/screenLayout';
import { ScreenShell } from '@/components/ScreenShell';
import {
  PickerFilterSheet,
  type PickerCategoryFilter,
} from '@/components/picker/PickerFilterSheet';
import { PhotoGradientOverlay } from '@/components/PhotoGradientOverlay';
import { RecipeCoverImage } from '@/components/RecipeCoverImage';
import { accentGlow } from '@/lib/design';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useFridge } from '@/context/FridgeContext';
import { useMealPlan } from '@/context/MealPlanContext';
import { useRecipes } from '@/context/RecipesContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { fridgeProgressColor } from '@/lib/fridgeMatchDisplay';
import { matchRecipeToFridge } from '@/lib/fridgeMatch';
import {
  clearPickerHistory,
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
import { todayLocalIso } from '@/utils/localDate';

type Phase = 'idle' | 'shuffling' | 'result';

const MEAL_SHORT: Record<MealSlot, string> = {
  breakfast: 'เช้า',
  lunch: 'กลางวัน',
  dinner: 'เย็น',
};

const MEAL_SEGMENT: Record<MealSlot, string> = {
  breakfast: 'มื้อเช้า',
  lunch: 'มื้อกลางวัน',
  dinner: 'มื้อเย็น',
};

function defaultMealSlot(): MealSlot {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  return 'dinner';
}

function todayIso(): string {
  return todayLocalIso();
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'สวัสดีตอนเช้า';
  if (hour < 15) return 'สวัสดีตอนเที่ยง';
  if (hour < 18) return 'สวัสดีตอนบ่าย';
  return 'สวัสดีตอนเย็น';
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
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ autoShuffle?: string }>();
  const { recipes, toggleFavorite } = useRecipes();
  const { items: fridgeItems } = useFridge();
  const { assignMeal } = useMealPlan();
  const { showSnackbar, showErrorSnackbar } = useSnackbar();

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
      showSnackbar(`เพิ่ม "${recipe.title}" ในแผน${MEAL_SHORT[meal]}วันนี้`);
    } catch (e) {
      showErrorSnackbar(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    }
  };

  const empty = pool.length === 0;
  const headerClearance = screenTopPadding(insets.top);
  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    parts.push(category === 'ทั้งหมด' ? 'ทุกหมวด' : category);
    if (maxMinutes != null) parts.push(`≤ ${maxMinutes} นาที`);
    if (maxCalories != null) parts.push(`≤ ${maxCalories} kcal`);
    return parts.join(' · ');
  }, [category, maxMinutes, maxCalories]);
  const onPrimaryPress = () => {
    if (phase === 'shuffling') stopShuffle();
    else startShuffle();
  };

  return (
    <ScreenShell>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerClearance,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <AppText variant="caption" muted>{greeting()}</AppText>
            <AppText variant="heading" style={styles.pageTitle}>วันนี้กินอะไรดี?</AppText>
          </View>
          <Pressable
            style={styles.diceBtn}
            onPress={onPrimaryPress}
            accessibilityLabel="สุ่มเมนู"
          >
            <Ionicons name="dice-outline" size={22} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.mealSegment}>
          {(['breakfast', 'lunch', 'dinner'] as MealSlot[]).map((slot) => (
            <Pressable
              key={slot}
              onPress={() => setMeal(slot)}
              style={[
                styles.mealSegBtn,
                meal === slot && styles.mealSegBtnOn,
                meal === slot && accentGlow(colors),
              ]}
            >
              <AppText
                variant="label"
                style={{ color: meal === slot ? colors.onAccent : colors.inkMuted, fontSize: 14 }}
              >
                {MEAL_SEGMENT[slot]}
              </AppText>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.filterSummaryRow}
          onPress={() => setFilterOpen(true)}
          accessibilityLabel="ตัวกรอง"
        >
          <Ionicons name="options-outline" size={18} color={colors.orange} />
          <AppText variant="label" style={styles.filterSummaryText} numberOfLines={1}>
            {filterSummary}
          </AppText>
          <Ionicons name="chevron-down" size={18} color={colors.inkMuted} />
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

            <View style={styles.shuffleRow}>
              <Pressable
                style={[styles.shufflePrimary, accentGlow(colors, true)]}
                onPress={onPrimaryPress}
                accessibilityLabel={phase === 'shuffling' ? 'หยุดสุ่ม' : 'สุ่มเมนูใหม่'}
              >
                <Ionicons
                  name={phase === 'shuffling' ? 'hand-left-outline' : 'dice-outline'}
                  size={22}
                  color={colors.onAccent}
                />
                <AppText style={styles.shufflePrimaryText}>
                  {phase === 'shuffling' ? 'แตะเพื่อหยุด' : 'สุ่มเมนูใหม่'}
                </AppText>
              </Pressable>
              <Pressable
                style={styles.playBtn}
                onPress={() => displayRecipe && router.push(`/recipe/${displayRecipe.id}`)}
                accessibilityLabel="ดูสูตร"
              >
                <Ionicons name="play" size={22} color={colors.ink} />
              </Pressable>
            </View>

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
            <View style={styles.historyHead}>
              <AppText variant="label" style={styles.historyTitle}>ที่เพิ่งสุ่มเจอ</AppText>
              <Pressable
                onPress={async () => {
                  await clearPickerHistory();
                  setHistory({});
                }}
                hitSlop={8}
              >
                <AppText variant="caption" style={styles.historyClear}>ล้าง</AppText>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.historyRow}>
                {recentHistory.map((r) => (
                  <Pressable
                    key={r.id}
                    style={styles.historyThumb}
                    onPress={() => finishPick(r)}
                  >
                    <RecipeCoverImage recipe={r} style={styles.historyImage} rounded={radius.md} />
                    <View style={styles.historyLabel}>
                      <AppText variant="caption" numberOfLines={1} style={styles.historyLabelText}>
                        {r.title}
                      </AppText>
                    </View>
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
    </ScreenShell>
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
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const cal = parseRecipeCalories(recipe);
  const mins = totalMinutes(recipe);
  const category = categoryChipLabel(recipe.category);
  const match = fridgeItems.length > 0 ? matchRecipeToFridge(recipe, fridgeItems) : null;
  const percent = match?.percent ?? 0;

  const mealBadge =
    meal === 'breakfast' ? 'มื้อเช้า' : meal === 'lunch' ? 'มื้อกลางวัน' : 'มื้อเย็น';

  return (
    <View style={[styles.heroCard, accentGlow(colors)]}>
      <View style={styles.heroImageWrap}>
        <RecipeCoverImage recipe={recipe} style={styles.heroImage} rounded={0} />
        <PhotoGradientOverlay variant="hero" />
        <View style={styles.heroBadge}>
          <AppText variant="caption" style={styles.heroBadgeText}>
            แนะนำสำหรับ{mealBadge}
          </AppText>
        </View>
        <View style={styles.heroBottomOverlay} pointerEvents="none">
          <AppText variant="title" style={styles.heroTitleOnImage} numberOfLines={2}>
            {recipe.title}
          </AppText>
          <View style={styles.heroMetaLine}>
            <Ionicons name="time-outline" size={14} color="#FFFFFF" />
            <AppText variant="caption" style={styles.heroMetaText}>{mins} นาที</AppText>
            {cal != null && (
              <>
                <AppText variant="caption" style={styles.heroMetaText}> · </AppText>
                <Ionicons name="flame-outline" size={14} color={colors.orange} />
                <AppText variant="caption" style={styles.heroMetaText}>{cal} kcal</AppText>
              </>
            )}
          </View>
        </View>
        <Pressable style={styles.favBtn} onPress={onFavorite}>
          <Ionicons
            name={recipe.isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={recipe.isFavorite ? colors.orange : colors.surface}
          />
        </Pressable>
        {phase === 'shuffling' && (
          <View style={styles.shufflingBadge}>
            <AppText variant="caption" style={styles.shufflingBadgeText}>กำลังสุ่ม...</AppText>
          </View>
        )}
      </View>
      <View style={styles.heroBody}>
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
                  { width: `${percent}%`, backgroundColor: fridgeProgressColor(percent, colors) },
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
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.metaChip}>
      {icon ? <Ionicons name={icon} size={13} color={colors.inkMuted} /> : null}
      <AppText variant="caption" muted>{label}</AppText>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleCol: { flex: 1, gap: 2 },
  diceBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 26, lineHeight: 34 },
  heroBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(14,13,12,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  heroBadgeText: { color: colors.ink, fontSize: 11 },
  mealSegment: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
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
  filterSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  filterSummaryText: {
    flex: 1,
    color: colors.orange,
    fontSize: 14,
  },
  shuffleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
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
  filterBadgeText: { color: colors.surface, fontFamily: fonts.semiBold, fontSize: 11 },
  heroOuter: { marginBottom: spacing.md },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
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
  heroBottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.xl,
    gap: 6,
  },
  heroTitleOnImage: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.semiBold,
    textAlign: 'left',
  },
  heroMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
  },
  heroMetaText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
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
  shufflingBadgeText: { color: colors.onAccent, fontFamily: fonts.semiBold },
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
  primaryActionText: { fontFamily: fonts.semiBold, color: colors.surface },
  heroPlaceholder: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
  },
  shufflePrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  shufflePrimaryText: { color: colors.onAccent, fontFamily: fonts.semiBold, fontSize: 18 },
  previewHint: { textAlign: 'center', marginBottom: spacing.xs },
  poolHint: { textAlign: 'center', marginBottom: spacing.md },
  emptyCard: {
    backgroundColor: colors.surface,
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
  historySection: { marginTop: spacing.lg },
  historyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  historyTitle: { fontFamily: fonts.semiBold },
  historyClear: { color: colors.orange, fontFamily: fonts.semiBold },
  historyRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.md },
  historyThumb: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
    position: 'relative',
  },
  historyImage: { width: 88, height: 88, flexShrink: 0 },
  historyLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 4,
    paddingVertical: 4,
    backgroundColor: 'rgba(14,13,12,0.72)',
  },
  historyLabelText: { color: colors.surface, fontSize: 10, lineHeight: 12 },
});
