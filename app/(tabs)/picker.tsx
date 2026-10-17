import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { RecipeCoverImage } from '@/components/RecipeCoverImage';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useMealPlan } from '@/context/MealPlanContext';
import { useRecipes } from '@/context/RecipesContext';
import {
  loadPickerHistory,
  pickRandom,
  preferFreshPool,
  recordPickerPick,
  type PickerHistoryStore,
} from '@/lib/pickerHistory';
import { categoryChipLabel, parseRecipeCalories } from '@/lib/recipeMedia';
import { totalMinutes } from '@/lib/storage';
import type { MealSlot } from '@/types/mealPlan';
import type { Recipe } from '@/types/recipe';

type PickerCategoryFilter = 'ทั้งหมด' | 'คลีน' | 'จานเดียว';
type Phase = 'idle' | 'shuffling' | 'result';

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'มื้อเช้า',
  lunch: 'มื้อกลางวัน',
  dinner: 'มื้อเย็น',
};

const MEAL_SHORT: Record<MealSlot, string> = {
  breakfast: 'เช้า',
  lunch: 'กลางวัน',
  dinner: 'เย็น',
};

const MEAL_RECOMMEND: Record<MealSlot, string> = {
  breakfast: 'แนะนำสำหรับมื้อเช้า',
  lunch: 'แนะนำสำหรับมื้อกลางวัน',
  dinner: 'แนะนำสำหรับมื้อเย็น',
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
    if (maxCalories != null) {
      if (cal == null || cal > maxCalories) return false;
    }
    return true;
  });
}

function pickAlternatives(main: Recipe, pool: Recipe[], count = 2): Recipe[] {
  const rest = pool.filter((r) => r.id !== main.id);
  const shuffled = [...rest].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function PickerScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ autoShuffle?: string }>();
  const { recipes, toggleFavorite } = useRecipes();
  const { assignMeal } = useMealPlan();

  const [category, setCategory] = useState<PickerCategoryFilter>('ทั้งหมด');
  const [maxMinutes, setMaxMinutes] = useState<number | null>(30);
  const [maxCalories, setMaxCalories] = useState<number | null>(500);
  const [meal, setMeal] = useState<MealSlot>(defaultMealSlot);
  const [history, setHistory] = useState<PickerHistoryStore>({});
  const [phase, setPhase] = useState<Phase>('idle');
  const [main, setMain] = useState<Recipe | null>(null);
  const [alternatives, setAlternatives] = useState<Recipe[]>([]);
  const [shufflePreview, setShufflePreview] = useState<Recipe | null>(null);
  const shuffleIndex = useRef(0);
  const autoShuffleDone = useRef(false);

  useEffect(() => {
    loadPickerHistory().then(setHistory);
  }, []);

  const pool = useMemo(
    () => filterPool(recipes, category, maxMinutes, maxCalories),
    [recipes, category, maxMinutes, maxCalories],
  );

  const pickPool = useMemo(() => preferFreshPool(pool, history), [pool, history]);

  const liveMain = useMemo(
    () => (main ? recipes.find((r) => r.id === main.id) ?? main : null),
    [main, recipes],
  );

  useEffect(() => {
    if (main && !pool.some((r) => r.id === main.id)) {
      setMain(null);
      setPhase('idle');
      setAlternatives([]);
    }
  }, [pool, main]);

  const finishPick = useCallback(
    async (recipe: Recipe) => {
      setMain(recipe);
      setAlternatives(pickAlternatives(recipe, pool));
      setPhase('result');
      await recordPickerPick(recipe.id);
      const nextHistory = await loadPickerHistory();
      setHistory(nextHistory);
    },
    [pool],
  );

  const startShuffle = useCallback(() => {
    if (pool.length === 0) {
      setMain(null);
      setPhase('idle');
      return;
    }
    setPhase('shuffling');
    shuffleIndex.current = 0;
    setShufflePreview(pickRandom(pool));
  }, [pool]);

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
  };

  const saveToTodayPlan = async () => {
    if (!main) return;
    try {
      await assignMeal(todayIso(), meal, main.id);
      Alert.alert('บันทึกแล้ว', `เพิ่ม "${main.title}" ในแผน${MEAL_SHORT[meal]}วันนี้`);
    } catch (e) {
      Alert.alert('บันทึกไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    }
  };

  const displayRecipe = phase === 'shuffling' ? shufflePreview : main;
  const empty = pool.length === 0;

  const relaxedCount = useMemo(() => {
    if (!empty || maxMinutes == null) return null;
    return filterPool(recipes, category, 30, maxCalories).length;
  }, [empty, maxMinutes, recipes, category, maxCalories]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + 120,
        paddingHorizontal: spacing.md,
      }}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="heading" style={styles.title}>
        {phase === 'shuffling' ? 'กำลังสุ่มเมนู...' : 'วันนี้กินอะไรดี?'}
      </AppText>
      {phase === 'shuffling' ? (
        <AppText muted style={styles.subtitle}>
          สุ่มจาก {pool.length} สูตร · {MEAL_LABELS[meal]}
        </AppText>
      ) : (
        <AppText muted style={styles.subtitle}>สุ่มเมนูจากสูตรของคุณตามตัวกรอง</AppText>
      )}

      <View style={styles.mealRow}>
        {(['breakfast', 'lunch', 'dinner'] as MealSlot[]).map((slot) => (
          <MealChip
            key={slot}
            label={MEAL_SHORT[slot]}
            active={meal === slot}
            onPress={() => setMeal(slot)}
          />
        ))}
      </View>

      {phase !== 'shuffling' && (
        <View style={styles.filters}>
          <FilterRow label="หมวด">
            {(['ทั้งหมด', 'คลีน', 'จานเดียว'] as PickerCategoryFilter[]).map((c) => (
              <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
            ))}
          </FilterRow>
          <FilterRow label="เวลาทำ">
            {[null, 15, 30].map((m) => (
              <Chip
                key={String(m)}
                label={m == null ? 'ตลอดเวลา' : `≤ ${m} น.`}
                active={maxMinutes === m}
                onPress={() => setMaxMinutes(m)}
              />
            ))}
          </FilterRow>
          <FilterRow label="แคลอรี">
            {[null, 300, 500].map((c) => (
              <Chip
                key={String(c)}
                label={c == null ? 'ไม่จำกัด' : `≤ ${c} kcal`}
                active={maxCalories === c}
                onPress={() => setMaxCalories(c)}
              />
            ))}
          </FilterRow>
        </View>
      )}

      {empty ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <AppText style={styles.emptyQ}>?</AppText>
          </View>
          <AppText variant="title" style={styles.emptyTitle}>ไม่มีเมนูตรงเงื่อนไข</AppText>
          <AppText muted style={styles.emptyBody}>
            ลองผ่อนตัวกรอง เช่น เพิ่มเวลาเป็น ≤ 30 นาที หรือเลือกหมวด ทั้งหมด
          </AppText>
          {relaxedCount != null && relaxedCount > 0 && (
            <AppText style={styles.emptyHint}>
              ตอนนี้ตรง 0 สูตร — ถ้าเพิ่มเวลาเป็น ≤ 30 น. จะพบ {relaxedCount} สูตร
            </AppText>
          )}
          <Pressable style={styles.clearBtn} onPress={clearFilters}>
            <AppText style={styles.clearBtnText}>ล้างตัวกรอง</AppText>
          </Pressable>
        </View>
      ) : phase === 'shuffling' ? (
        <View style={styles.shuffleBlock}>
          <View style={styles.shuffleStack}>
            {shufflePreview ? (
              <>
                <View style={[styles.stackCard, styles.stackBack]} />
                <View style={[styles.stackCard, styles.stackMid]} />
                <View style={styles.stackCard}>
                  <RecipeCoverImage recipe={shufflePreview} style={styles.heroPhoto} rounded={radius.xl} />
                </View>
              </>
            ) : (
              <ActivityIndicator size="large" color={colors.orange} />
            )}
          </View>
          <AppText muted style={styles.shuffleStatus}>
            สุ่มจาก {pool.length} สูตรของคุณ
          </AppText>
          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <Pressable style={styles.stopBtn} onPress={stopShuffle}>
            <AppText style={styles.stopBtnText}>แตะเพื่อหยุด</AppText>
          </Pressable>
        </View>
      ) : phase === 'result' && liveMain ? (
        <>
          <ResultCard
            recipe={liveMain}
            meal={meal}
            onFavorite={() => toggleFavorite(liveMain.id)}
            onCook={() => router.push(`/recipe/cook/${liveMain.id}`)}
            onView={() => router.push(`/recipe/${liveMain.id}`)}
            onReshuffle={startShuffle}
            onSavePlan={saveToTodayPlan}
          />
          {alternatives.length > 0 && (
            <View style={styles.altSection}>
              <AppText variant="label" style={styles.altTitle}>ตัวเลือกอื่น</AppText>
              {alternatives.map((alt) => (
                <AltRow
                  key={alt.id}
                  recipe={alt}
                  onPress={() => finishPick(alt)}
                />
              ))}
            </View>
          )}
        </>
      ) : (
        <>
          <SuggestionCard
            recipe={main}
            meal={meal}
            onReshuffle={startShuffle}
            onView={() => main && router.push(`/recipe/${main.id}`)}
            onCook={() => main && router.push(`/recipe/cook/${main.id}`)}
          />
          <Pressable style={styles.primaryShuffle} onPress={startShuffle}>
            <Ionicons name="shuffle" size={22} color={colors.white} />
            <AppText style={styles.primaryShuffleText}>สุ่มเมนู</AppText>
          </Pressable>
        </>
      )}

      {!empty && phase !== 'shuffling' && (
        <AppText variant="caption" muted style={styles.footer}>
          ตรงตัวกรอง {pool.length} จาก {recipes.length} สูตร — ไม่ซ้ำใน 3 วันที่ผ่านมา
        </AppText>
      )}
    </ScrollView>
  );
}

function MealChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.mealChip, active && styles.mealChipOn]}>
      <AppText variant="label" style={{ color: active ? colors.white : colors.ink, fontSize: 15 }}>
        {label}
      </AppText>
    </Pressable>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterRow}>
      <AppText variant="caption" muted>{label}</AppText>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <AppText variant="caption" style={{ color: active ? colors.white : colors.ink, fontFamily: fonts.medium }}>
        {label}
      </AppText>
    </Pressable>
  );
}

function MetaRow({ recipe }: { recipe: Recipe }) {
  const cal = parseRecipeCalories(recipe);
  return (
    <View style={styles.metaRow}>
      <Ionicons name="time-outline" size={16} color={colors.inkMuted} />
      <AppText variant="caption" muted>{totalMinutes(recipe)} นาที</AppText>
      {cal != null && (
        <>
          <Ionicons name="flame-outline" size={16} color={colors.orange} style={styles.metaGap} />
          <AppText variant="caption" muted>{cal} kcal</AppText>
        </>
      )}
      <AppText variant="caption" muted style={styles.metaGap}>· {categoryChipLabel(recipe.category)}</AppText>
    </View>
  );
}

function SuggestionCard({
  recipe,
  meal,
  onReshuffle,
  onView,
  onCook,
}: {
  recipe: Recipe | null;
  meal: MealSlot;
  onReshuffle: () => void;
  onView: () => void;
  onCook: () => void;
}) {
  return (
    <View style={styles.suggestCard}>
      {recipe ? (
        <>
          <View style={styles.recTag}>
            <AppText variant="caption" style={styles.recTagText}>{MEAL_RECOMMEND[meal]}</AppText>
          </View>
          <RecipeCoverImage recipe={recipe} style={styles.heroPhoto} rounded={radius.lg} />
          <AppText variant="title" style={styles.cardTitle}>{recipe.title}</AppText>
          <MetaRow recipe={recipe} />
          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryBtn} onPress={onReshuffle}>
              <Ionicons name="shuffle" size={18} color={colors.ink} />
              <AppText style={styles.secondaryBtnText}>สุ่มใหม่</AppText>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={onCook}>
              <AppText style={styles.primaryBtnText}>ดูสูตร / เริ่มทำ</AppText>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="restaurant-outline" size={48} color={colors.inkMuted} />
          <AppText muted style={{ textAlign: 'center', marginTop: spacing.sm }}>
            กดสุ่มเมนูเพื่อดูเมนูแนะนำพร้อมรูปจาน
          </AppText>
          <Pressable style={[styles.primaryBtn, { marginTop: spacing.md, alignSelf: 'stretch' }]} onPress={onReshuffle}>
            <AppText style={styles.primaryBtnText}>สุ่มเลย</AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ResultCard({
  recipe,
  meal,
  onFavorite,
  onCook,
  onView,
  onReshuffle,
  onSavePlan,
}: {
  recipe: Recipe;
  meal: MealSlot;
  onFavorite: () => void;
  onCook: () => void;
  onView: () => void;
  onReshuffle: () => void;
  onSavePlan: () => void;
}) {
  return (
    <View style={styles.resultCard}>
      <View style={styles.heroWrap}>
        <RecipeCoverImage recipe={recipe} style={styles.heroPhotoTall} rounded={radius.xl} />
        <Pressable style={styles.favBtn} onPress={onFavorite}>
          <Ionicons
            name={recipe.isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={recipe.isFavorite ? colors.orange : colors.white}
          />
        </Pressable>
      </View>
      <AppText variant="title" style={styles.cardTitle}>{recipe.title}</AppText>
      <MetaRow recipe={recipe} />
      <Pressable style={styles.cookMainBtn} onPress={onCook}>
        <AppText style={styles.primaryBtnText}>ทำเมนูนี้</AppText>
      </Pressable>
      <Pressable style={styles.outlineBtn} onPress={onSavePlan}>
        <AppText style={styles.outlineBtnText}>เก็บไว้ในแผนวันนี้ ({MEAL_SHORT[meal]})</AppText>
      </Pressable>
      <Pressable onPress={onReshuffle} style={styles.linkBtn}>
        <AppText style={styles.linkText}>ไม่เอา สุ่มใหม่</AppText>
      </Pressable>
      <Pressable onPress={onView} style={styles.linkBtn}>
        <AppText style={styles.linkTextMuted}>ดูรายละเอียดสูตร</AppText>
      </Pressable>
    </View>
  );
}

function AltRow({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const cal = parseRecipeCalories(recipe);
  return (
    <Pressable style={styles.altRow} onPress={onPress}>
      <RecipeCoverImage recipe={recipe} style={styles.altThumb} rounded={radius.md} iconSize={24} />
      <View style={styles.altText}>
        <AppText variant="label" numberOfLines={2}>{recipe.title}</AppText>
        <AppText variant="caption" muted>
          {totalMinutes(recipe)} น.{cal != null ? ` · ${cal} kcal` : ''}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.md },
  mealRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  mealChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  mealChipOn: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  filters: { gap: spacing.sm, marginBottom: spacing.md },
  filterRow: { gap: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  suggestCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#3A2A20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  recTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  recTagText: { color: colors.ink, fontFamily: fonts.medium },
  heroPhoto: { width: '100%', height: 200, marginBottom: spacing.md },
  heroPhotoTall: { width: '100%', height: 220 },
  heroWrap: { position: 'relative', marginBottom: spacing.md },
  favBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(58,42,32,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { marginBottom: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: spacing.md },
  metaGap: { marginLeft: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: { fontFamily: fonts.semiBold, color: colors.ink },
  primaryBtn: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.orange,
  },
  primaryBtnText: { color: colors.white, fontFamily: fonts.semiBold, fontSize: 16 },
  placeholder: { alignItems: 'center', paddingVertical: spacing.xl },
  primaryShuffle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  primaryShuffleText: { color: colors.white, fontFamily: fonts.semiBold, fontSize: 18 },
  footer: { textAlign: 'center', marginTop: spacing.md },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyQ: { fontSize: 32, fontFamily: fonts.bold, color: colors.inkMuted },
  emptyTitle: { textAlign: 'center', marginBottom: spacing.sm },
  emptyBody: { textAlign: 'center', marginBottom: spacing.md },
  emptyHint: {
    textAlign: 'center',
    color: colors.orange,
    fontFamily: fonts.medium,
    marginBottom: spacing.md,
  },
  clearBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.orange,
  },
  clearBtnText: { color: colors.orange, fontFamily: fonts.semiBold },
  shuffleBlock: { alignItems: 'center', marginBottom: spacing.lg },
  shuffleStack: { width: '100%', height: 240, marginBottom: spacing.md, position: 'relative' },
  stackCard: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    height: 200,
    borderRadius: radius.xl,
    overflow: 'hidden',
    top: 20,
  },
  stackBack: {
    top: 36,
    left: spacing.xl,
    right: spacing.xl,
    height: 180,
    backgroundColor: '#E8DDD0',
    opacity: 0.5,
  },
  stackMid: {
    top: 28,
    left: spacing.lg,
    right: spacing.lg,
    height: 190,
    backgroundColor: '#F5EBE0',
    opacity: 0.7,
  },
  shuffleStatus: { marginBottom: spacing.sm },
  dots: { flexDirection: 'row', gap: 6, marginBottom: spacing.lg },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.orange,
    opacity: 0.5,
  },
  stopBtn: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
  },
  stopBtnText: { color: colors.white, fontFamily: fonts.semiBold, fontSize: 17 },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cookMainBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  outlineBtn: {
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.orange,
    marginBottom: spacing.sm,
  },
  outlineBtnText: { color: colors.orange, fontFamily: fonts.semiBold },
  linkBtn: { alignItems: 'center', paddingVertical: spacing.xs },
  linkText: { color: colors.orange, fontFamily: fonts.semiBold },
  linkTextMuted: { color: colors.inkMuted, fontFamily: fonts.medium },
  altSection: { marginBottom: spacing.md },
  altTitle: { marginBottom: spacing.sm },
  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  altThumb: { width: 56, height: 56 },
  altText: { flex: 1, gap: 2 },
});
