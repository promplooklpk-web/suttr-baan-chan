import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { BlurView } from 'expo-blur';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { PhotoGradientOverlay } from '@/components/PhotoGradientOverlay';
import { accentGlow } from '@/lib/design';
import { RecipeAttribution } from '@/components/RecipeAttribution';
import { StepPhotoBlock } from '@/components/StepPhotoBlock';
import { StepTimerChip } from '@/components/StepTimerChip';
import { SHOW_STEP_PHOTOS } from '@/constants/featureFlags';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { fridgeBadgeColors } from '@/components/FridgeMatchBadge';
import { useFridge } from '@/context/FridgeContext';
import { useRecipes } from '@/context/RecipesContext';
import { matchRecipeToFridge } from '@/lib/fridgeMatch';
import { matchPercentColor } from '@/lib/fridgeMatchDisplay';
import { parseRecipeCalories } from '@/lib/recipeMedia';
import { photoUri, totalMinutes } from '@/lib/storage';

type TabKey = 'ingredients' | 'steps' | 'notes';

function scaleAmount(amount: number | undefined, factor: number): string {
  if (amount == null) return '';
  const scaled = amount * factor;
  return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
}

export default function RecipeDetailScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getRecipe, toggleFavorite, deleteRecipe } = useRecipes();
  const { items: fridgeItems } = useFridge();
  const recipe = getRecipe(id);
  const [tab, setTab] = useState<TabKey>('ingredients');
  const [servings, setServings] = useState(recipe?.servings ?? 1);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (recipe?.servings) setServings(recipe.servings);
  }, [recipe?.id, recipe?.servings]);

  const baseServings = recipe?.servings ?? 1;
  const factor = servings / baseServings;

  const uri = photoUri(recipe?.photo?.path);

  const fridgeMatch = useMemo(() => {
    if (!recipe || fridgeItems.length === 0) return null;
    return matchRecipeToFridge(recipe, fridgeItems);
  }, [recipe, fridgeItems]);

  const tabs: { key: TabKey; label: string }[] = useMemo(
    () => [
      { key: 'ingredients', label: 'ส่วนผสม' },
      { key: 'steps', label: 'วิธีทำ' },
      { key: 'notes', label: 'โน้ต' },
    ],
    [],
  );

  const tagChips = useMemo(() => {
    if (!recipe) return [];
    const tags = [...(recipe.tags ?? [])];
    if (recipe.category && !tags.includes(recipe.category)) tags.unshift(recipe.category);
    return tags.slice(0, 5);
  }, [recipe?.category, recipe?.tags]);

  if (!recipe) {
    return (
      <View style={styles.missing}>
        <AppText variant="title">ไม่พบสูตร</AppText>
        <Pressable onPress={() => router.back()}>
          <AppText style={{ color: colors.orange }}>กลับ</AppText>
        </Pressable>
      </View>
    );
  }

  const minutes = totalMinutes(recipe);
  const calories = parseRecipeCalories(recipe);

  const onDelete = () => {
    Alert.alert('ลบสูตรนี้?', 'การลบไม่สามารถย้อนกลับได้', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบสูตร',
        style: 'destructive',
        onPress: async () => {
          await deleteRecipe(recipe.id);
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          <View style={styles.hero}>
            {uri ? (
              <Image source={{ uri }} style={styles.heroImage} contentFit="cover" />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Ionicons name="restaurant" size={64} color={colors.orange} />
              </View>
            )}
            <PhotoGradientOverlay variant="hero" />
            <View style={[styles.heroControls, { top: insets.top + spacing.sm }]}>
              <GlassIconButton
                accessibilityLabel="กลับ"
                onPress={() => router.back()}
                icon="chevron-back"
                colors={colors}
              />
              <View style={styles.heroControlsRight}>
                <GlassIconButton
                  accessibilityLabel="แก้ไขสูตร"
                  onPress={() => router.push({ pathname: '/recipe/edit', params: { id: recipe.id } })}
                  icon="create-outline"
                  colors={colors}
                />
                <GlassIconButton
                  accessibilityLabel="โปรด"
                  onPress={() => toggleFavorite(recipe.id)}
                  icon={recipe.isFavorite ? 'heart' : 'heart-outline'}
                  colors={colors}
                  accent
                />
              </View>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.titlePercentRow}>
              <AppText variant="heading" style={styles.detailTitle}>{recipe.title}</AppText>
              {fridgeMatch && (
                <AppText style={[styles.detailPercent, { color: matchPercentColor(fridgeMatch.percent, colors) }]}>
                  {fridgeMatch.percent}%
                </AppText>
              )}
            </View>
            {tagChips.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagRow}
              >
                {tagChips.map((tag) => (
                  <View key={tag} style={[styles.tagChip, accentGlow(colors, false)]}>
                    <AppText variant="caption" style={styles.tagChipText}>#{tag}</AppText>
                  </View>
                ))}
              </ScrollView>
            )}
            {recipe.rating != null && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color={colors.star} />
                <AppText muted>{recipe.rating.toFixed(1)}</AppText>
              </View>
            )}

            <View style={styles.infoBar}>
              <InfoPill icon="time-outline" label={`${minutes}`} sub="นาที" />
              <InfoPill icon="flame-outline" label={calories != null ? `${calories}` : '—'} sub="kcal" />
              <InfoPill icon="people-outline" label={`${servings}`} sub="เสิร์ฟ" />
            </View>

            {fridgeMatch && (
              <View
                style={[
                  styles.fridgeSummary,
                  { backgroundColor: fridgeBadgeColors(fridgeMatch.percent, colors).backgroundColor },
                ]}
              >
                <AppText
                  variant="label"
                  style={{ color: fridgeBadgeColors(fridgeMatch.percent, colors).color }}
                >
                  มีในตู้ {fridgeMatch.percent}% ({fridgeMatch.haveCount}/{fridgeMatch.totalCount} อย่าง)
                </AppText>
              </View>
            )}

            <View style={styles.tabRow}>
              {tabs.map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
                >
                  <AppText
                    variant="label"
                    style={{ color: tab === t.key ? colors.white : colors.ink }}
                  >
                    {t.label}
                  </AppText>
                </Pressable>
              ))}
            </View>

            {tab === 'ingredients' && (
              <View>
                <View style={styles.servingRow}>
                  <AppText variant="label">จำนวนเสิร์ฟ</AppText>
                  <View style={styles.servingControls}>
                    <RoundBtn
                      label="−"
                      onPress={() => setServings((s) => Math.max(1, s - 1))}
                    />
                    <AppText variant="title" style={styles.servingCount}>{servings}</AppText>
                    <RoundBtn label="+" onPress={() => setServings((s) => s + 1)} />
                  </View>
                </View>
                {fridgeMatch && (
                  <View style={styles.ingTableHeader}>
                    <AppText variant="caption" muted style={styles.ingColName}>รายการ</AppText>
                    <AppText variant="caption" muted style={styles.ingColStatus}>ในตู้</AppText>
                    <AppText variant="caption" muted style={styles.ingColAmt}>ปริมาณ</AppText>
                  </View>
                )}
                <View style={fridgeMatch ? styles.ingTable : undefined}>
                {recipe.ingredients.map((ing, i) => {
                  const fridgeLine = fridgeMatch?.details[i];
                  const inFridge = fridgeLine?.have ?? false;
                  return (
                    <Pressable
                      key={`${ing.name}-${i}`}
                      style={styles.ingRow}
                      onPress={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                    >
                      {fridgeMatch ? (
                        <Ionicons
                          name={inFridge ? 'checkmark-circle' : 'close-circle'}
                          size={22}
                          color={inFridge ? colors.cardGreen : colors.danger}
                        />
                      ) : (
                        <Ionicons
                          name={checked[i] ? 'checkbox' : 'square-outline'}
                          size={22}
                          color={checked[i] ? colors.orange : colors.inkMuted}
                        />
                      )}
                      <View style={styles.ingMain}>
                        <AppText style={[styles.ingName, !inFridge && fridgeMatch && styles.ingMissing]}>
                          {ing.name}
                        </AppText>
                        {fridgeMatch && !inFridge && (
                          <AppText variant="caption" style={styles.ingFridgeHint}>
                            {fridgeLine?.expiredInFridge ? 'หมดอายุในตู้' : 'ไม่มีในตู้'}
                          </AppText>
                        )}
                      </View>
                      <AppText muted style={styles.ingAmount}>
                        {[scaleAmount(ing.amount, factor), ing.unit].filter(Boolean).join(' ')}
                      </AppText>
                      {fridgeMatch ? (
                        <Ionicons
                          name={checked[i] ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={checked[i] ? colors.orange : colors.inkLight}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
                </View>
              </View>
            )}

            {tab === 'steps' && (
              <View>
                <View style={styles.steps}>
                  {recipe.steps.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={styles.stepNum}>
                        <AppText style={styles.stepNumText}>{i + 1}</AppText>
                      </View>
                      <View style={styles.stepContent}>
                        <AppText style={styles.stepText}>{step.text}</AppText>
                        {step.timerSeconds != null && step.timerSeconds > 0 && (
                          <StepTimerChip timerSeconds={step.timerSeconds} />
                        )}
                        {SHOW_STEP_PHOTOS && step.photo?.path ? (
                          <StepPhotoBlock photo={step.photo} />
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>

                {recipe.tips && recipe.tips.length > 0 && (
                  <View style={styles.tipsBox}>
                    <AppText variant="title" style={styles.tipsTitle}>เคล็ดลับ</AppText>
                    {recipe.tips.map((tip, i) => (
                      <View key={i} style={styles.tipRow}>
                        <AppText style={styles.tipBullet}>•</AppText>
                        <AppText style={styles.tipText}>{tip}</AppText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {tab === 'notes' && (
              <View>
                {recipe.caloriesEstimate ? (
                  <View style={styles.calorieBox}>
                    <AppText variant="label">พลังงานโดยประมาณ</AppText>
                    <AppText style={styles.calorieText}>{recipe.caloriesEstimate}</AppText>
                    <AppText variant="caption" muted style={styles.calorieHint}>
                      ค่าประมาณจากสูตรต้นฉบับ อาจแตกต่างตามวัตถุดิบและปริมาณจริง
                    </AppText>
                  </View>
                ) : null}
                <AppText muted style={styles.notes}>
                  {recipe.notes?.trim() ? recipe.notes : 'ยังไม่มีโน้ตเพิ่มเติม'}
                </AppText>
              </View>
            )}

            <RecipeAttribution recipe={recipe} />

            <Pressable onPress={onDelete} style={styles.deleteLink}>
              <AppText style={{ color: colors.danger }}>ลบสูตร</AppText>
            </Pressable>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable
            style={[styles.cookBtn, accentGlow(colors, true)]}
            onPress={() => router.push(`/recipe/cook/${recipe.id}`)}
          >
            <AppText style={styles.cookBtnText}>เริ่มทำเมนูนี้</AppText>
          </Pressable>
        </View>
      </View>
    </>
  );
}

function InfoPill({
  icon,
  label,
  sub,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.infoPill}>
      <AppText variant="title" style={styles.infoPillValue}>{label}</AppText>
      <AppText variant="caption" muted>{sub ?? ''}</AppText>
      <Ionicons name={icon} size={16} color={colors.orange} style={styles.infoPillIcon} />
    </View>
  );
}

function RoundBtn({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable onPress={onPress} style={styles.roundBtn}>
      <AppText style={styles.roundBtnText}>{label}</AppText>
    </Pressable>
  );
}

function GlassIconButton({
  icon,
  onPress,
  accessibilityLabel,
  colors,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  colors: ThemeColors;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={glassBtnStyles.outer}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 70 : 85}
        tint="dark"
        style={glassBtnStyles.blur}
      >
        <View style={[glassBtnStyles.tint, { backgroundColor: colors.glassTint }]} pointerEvents="none" />
        <Ionicons
          name={icon}
          size={22}
          color={accent ? colors.orange : colors.white}
        />
      </BlurView>
    </Pressable>
  );
}

const glassBtnStyles = StyleSheet.create({
  outer: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  blur: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tint: {
    ...StyleSheet.absoluteFill,
  },
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.cream,
  },
  hero: {
    width: '100%',
    height: 360,
    position: 'relative',
    overflow: 'hidden',
  },
  heroControls: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  heroControlsRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    marginTop: -28,
    padding: spacing.md,
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  tagRow: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'flex-start',
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipText: {
    fontFamily: fonts.semiBold,
    color: colors.orange,
  },
  titlePercentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  detailTitle: {
    flex: 1,
    fontSize: 24,
    lineHeight: 30,
  },
  detailPercent: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 30,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  fridgeSummary: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoPillValue: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  infoPillIcon: {
    position: 'absolute',
    opacity: 0,
  },
  infoPillLegacy: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtnActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  servingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  servingCount: {
    minWidth: 32,
    textAlign: 'center',
  },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnText: {
    color: colors.white,
    fontSize: 20,
    fontFamily: fonts.bold,
    lineHeight: 22,
  },
  ingTable: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  ingTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 4,
    gap: spacing.sm,
  },
  ingColName: { flex: 1 },
  ingColStatus: { width: 56, textAlign: 'center' },
  ingColAmt: { width: 72, textAlign: 'right' },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  ingMain: {
    flex: 1,
    gap: 2,
  },
  ingName: {},
  ingMissing: {
    color: colors.inkMuted,
  },
  ingFridgeHint: {
    color: colors.danger,
  },
  ingAmount: {
    minWidth: 56,
    textAlign: 'right',
  },
  steps: {
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepContent: {
    flex: 1,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  stepText: {
    paddingTop: 2,
    lineHeight: 24,
  },
  tipsBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsTitle: {
    marginBottom: spacing.sm,
    fontSize: 18,
  },
  tipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipBullet: {
    color: colors.orange,
    fontFamily: fonts.bold,
  },
  tipText: {
    flex: 1,
    lineHeight: 22,
  },
  calorieBox: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  calorieText: {
    lineHeight: 24,
  },
  calorieHint: {
    marginTop: spacing.xs,
  },
  notes: {
    lineHeight: 24,
  },
  deleteLink: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.cream,
  },
  cookBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cookBtnText: {
    color: colors.onAccent,
    fontFamily: fonts.semiBold,
    fontSize: 18,
  },
});
