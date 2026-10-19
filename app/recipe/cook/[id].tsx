import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { StepTimerChip } from '@/components/StepTimerChip';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRecipes } from '@/context/RecipesContext';
function scaleAmount(amount: number | undefined, factor: number): string {
  if (amount == null) return '';
  const scaled = amount * factor;
  return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
}

export default function CookingModeScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getRecipe } = useRecipes();
  const recipe = getRecipe(id);

  const [stepIndex, setStepIndex] = useState(0);
  const [servings, setServings] = useState(recipe?.servings ?? 1);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [showIngredients, setShowIngredients] = useState(false);

  const baseServings = recipe?.servings ?? 1;
  const factor = servings / baseServings;
  const steps = recipe?.steps ?? [];
  const step = steps[stepIndex];
  const progress = steps.length ? (stepIndex + 1) / steps.length : 0;

  useEffect(() => {
    activateKeepAwakeAsync('cooking-mode');
    return () => {
      deactivateKeepAwake('cooking-mode');
    };
  }, []);

  useEffect(() => {
    if (recipe?.servings) setServings(recipe.servings);
  }, [recipe?.id, recipe?.servings]);

  const onTimerDone = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, []);

  if (!recipe || !step) {
    return (
      <View style={styles.missing}>
        <AppText variant="title">ไม่พบสูตร</AppText>
        <Pressable onPress={() => router.back()}>
          <AppText style={{ color: colors.orange }}>กลับ</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.ink} />
        </Pressable>
        <AppText variant="label" muted>
          ขั้นที่ {stepIndex + 1}/{steps.length}
        </AppText>
        <Pressable onPress={() => setShowIngredients((v) => !v)} hitSlop={12}>
          <Ionicons name="list-outline" size={26} color={colors.orange} />
        </Pressable>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <AppText variant="caption" muted style={styles.recipeTitle}>{recipe.title}</AppText>

      <View style={styles.stepArea}>
        <AppText style={styles.stepText}>{step.text}</AppText>
        {step.timerSeconds != null && step.timerSeconds > 0 && (
          <StepTimerChip
            key={`timer-${stepIndex}`}
            timerKey={`${recipe.id}-${stepIndex}`}
            timerSeconds={step.timerSeconds}
            onComplete={onTimerDone}
          />
        )}
      </View>

      {showIngredients && (
        <ScrollView style={styles.ingPanel} contentContainerStyle={styles.ingContent}>
          <View style={styles.servingRow}>
            <AppText variant="label">เสิร์ฟ</AppText>
            <View style={styles.servingControls}>
              <RoundBtn label="−" onPress={() => setServings((s) => Math.max(1, s - 1))} />
              <AppText variant="title">{servings}</AppText>
              <RoundBtn label="+" onPress={() => setServings((s) => s + 1)} />
            </View>
          </View>
          {recipe.ingredients.map((ing, i) => (
            <Pressable
              key={`${ing.name}-${i}`}
              style={styles.ingRow}
              onPress={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
            >
              <Ionicons
                name={checked[i] ? 'checkbox' : 'square-outline'}
                size={22}
                color={checked[i] ? colors.orange : colors.inkMuted}
              />
              <AppText style={styles.ingName}>{ing.name}</AppText>
              <AppText muted>
                {[scaleAmount(ing.amount, factor), ing.unit].filter(Boolean).join(' ')}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.navRow}>
        <Pressable
          style={[styles.navBtn, stepIndex === 0 && styles.navBtnDisabled]}
          disabled={stepIndex === 0}
          onPress={() => setStepIndex((i) => Math.max(0, i - 1))}
        >
          <Ionicons name="chevron-back" size={22} color={colors.surface} />
          <AppText style={styles.navBtnText}>ก่อนหน้า</AppText>
        </Pressable>
        {stepIndex < steps.length - 1 ? (
          <Pressable
            style={styles.navBtn}
            onPress={() => setStepIndex((i) => i + 1)}
          >
            <AppText style={styles.navBtnText}>ถัดไป</AppText>
            <Ionicons name="chevron-forward" size={22} color={colors.surface} />
          </Pressable>
        ) : (
          <Pressable style={styles.navBtn} onPress={() => router.back()}>
            <AppText style={styles.navBtnText}>เสร็จแล้ว</AppText>
          </Pressable>
        )}
      </View>
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: spacing.md },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: { height: '100%', backgroundColor: colors.orange },
  recipeTitle: { marginBottom: spacing.lg },
  stepArea: { flex: 1, justifyContent: 'center' },
  stepText: {
    fontSize: 28,
    lineHeight: 40,
    fontFamily: fonts.semiBold,
    color: colors.ink,
  },
  ingPanel: {
    maxHeight: 220,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ingContent: { padding: spacing.md },
  servingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  servingControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  roundBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnText: { color: colors.surface, fontFamily: fonts.bold, fontSize: 18 },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  ingName: { flex: 1 },
  navRow: { flexDirection: 'row', gap: spacing.md },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { color: colors.surface, fontFamily: fonts.semiBold, fontSize: 17 },
});
