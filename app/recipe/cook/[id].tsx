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
import { GlassIconButton } from '@/components/GlassIconButton';
import { GlassBottomBar } from '@/components/GlassBottomBar';
import { ProgressRing } from '@/components/ProgressRing';
import { formatTimerSeconds } from '@/lib/format';
import { CookTimerBar, CookTimerBarSpacer } from '@/components/CookTimerBar';
import { StepTimerChip } from '@/components/StepTimerChip';
import { loadAppSettings } from '@/lib/appSettings';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useCookTimers } from '@/context/CookTimerContext';
import { useRecipes } from '@/context/RecipesContext';
function scaleAmount(amount: number | undefined, factor: number): string {
  if (amount == null) return '';
  const scaled = amount * factor;
  return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
}

export default function CookingModeScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { id, servings: servingsParam } = useLocalSearchParams<{ id: string; servings?: string }>();
  const insets = useSafeAreaInsets();
  const { getRecipe } = useRecipes();
  const { clearAllTimers } = useCookTimers();
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
      clearAllTimers();
    };
  }, [clearAllTimers]);

  useEffect(() => {
    const fromParam = servingsParam ? parseInt(servingsParam, 10) : NaN;
    if (Number.isFinite(fromParam) && fromParam > 0) {
      setServings(fromParam);
      return;
    }
    if (recipe?.servings) setServings(recipe.servings);
  }, [recipe?.id, recipe?.servings, servingsParam]);

  const [autoStartTimers, setAutoStartTimers] = useState(false);
  useEffect(() => {
    loadAppSettings().then((s) => setAutoStartTimers(s.cookAutoStartTimers));
  }, []);

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
      <CookTimerBar />
      <CookTimerBarSpacer />
      <View style={styles.topBar}>
        <GlassIconButton
          icon="close"
          onPress={() => router.back()}
          accessibilityLabel="ปิดโหมดทำอาหาร"
        />
        <AppText variant="label" muted>
          ขั้นที่ {stepIndex + 1}/{steps.length}
        </AppText>
        <Pressable onPress={() => setShowIngredients((v) => !v)} hitSlop={12}>
          <Ionicons name="list-outline" size={26} color={colors.orange} />
        </Pressable>
      </View>

      <View style={styles.segmentRow}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              { backgroundColor: i <= stepIndex ? colors.orange : colors.surface2 },
            ]}
          />
        ))}
      </View>

      <AppText variant="caption" muted style={styles.recipeTitle}>{recipe.title}</AppText>

      <View style={styles.stepArea}>
        <AppText style={styles.stepText}>{step.text}</AppText>
        {step.timerSeconds != null && step.timerSeconds > 0 && (
          <CookTimerBlock
            timerKey={`${recipe.id}-${stepIndex}`}
            timerSeconds={step.timerSeconds}
            timerLabel={`${recipe.title} · ขั้น ${stepIndex + 1}`}
            autoStart={autoStartTimers}
            onComplete={onTimerDone}
          />
        )}
        {stepIndex < steps.length - 1 && (
          <AppText variant="caption" muted style={styles.nextPreview}>
            ถัดไป: {steps[stepIndex + 1]?.text}
          </AppText>
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

      <GlassBottomBar>
        <View style={styles.navRow}>
          <Pressable
            style={[styles.navBtnSecondary, stepIndex === 0 && styles.navBtnDisabled]}
            disabled={stepIndex === 0}
            onPress={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
            <AppText style={styles.navBtnSecondaryText}>ก่อนหน้า</AppText>
          </Pressable>
          {stepIndex < steps.length - 1 ? (
            <Pressable style={styles.navBtnPrimary} onPress={() => setStepIndex((i) => i + 1)}>
              <AppText style={styles.navBtnText}>ถัดไป</AppText>
              <Ionicons name="chevron-forward" size={20} color={colors.onAccent} />
            </Pressable>
          ) : (
            <Pressable style={styles.navBtnPrimary} onPress={() => router.back()}>
              <AppText style={styles.navBtnText}>เสร็จแล้ว</AppText>
            </Pressable>
          )}
        </View>
      </GlassBottomBar>
    </View>
  );
}

function CookTimerBlock({
  timerKey,
  timerSeconds,
  timerLabel,
  autoStart,
  onComplete,
}: {
  timerKey: string;
  timerSeconds: number;
  timerLabel: string;
  autoStart: boolean;
  onComplete: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { getTimer, remainingSeconds } = useCookTimers();
  const timer = getTimer(timerKey);
  const remaining = timer ? remainingSeconds(timerKey) : timerSeconds;
  const progress = timerSeconds > 0 ? 1 - remaining / timerSeconds : 0;

  return (
    <View style={styles.timerBlock}>
      <ProgressRing
        size={58}
        progress={Math.min(1, Math.max(0, progress))}
        color={colors.orange}
        center={
          <AppText variant="micro" style={{ fontFamily: fonts.semiBold }}>
            {formatTimerSeconds(remaining)}
          </AppText>
        }
      />
      <View style={styles.timerTextCol}>
        <AppText variant="label">ตัวจับเวลา</AppText>
        <StepTimerChip
          timerKey={timerKey}
          timerSeconds={timerSeconds}
          timerLabel={timerLabel}
          autoStart={autoStart}
          onComplete={onComplete}
        />
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
  closeHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentRow: { flexDirection: 'row', gap: 4, marginBottom: spacing.md },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  nextPreview: { marginTop: spacing.lg, lineHeight: 20 },
  timerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  timerTextCol: { flex: 1, gap: spacing.xs },
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
  navBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface2,
  },
  navBtnSecondaryText: { color: colors.ink, fontFamily: fonts.semiBold, fontSize: 16 },
  navBtnPrimary: {
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
  navBtnText: { color: colors.onAccent, fontFamily: fonts.semiBold, fontSize: 17 },
});
