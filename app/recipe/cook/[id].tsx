import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Glass } from '@/components/Glass';
import { GlassIconButton } from '@/components/GlassIconButton';
import { GlassBottomBar } from '@/components/GlassBottomBar';
import { ProgressRing } from '@/components/ProgressRing';
import { RecipeCoverImage } from '@/components/RecipeCoverImage';
import { formatTimerSeconds } from '@/lib/format';
import { CookTimerBar, CookTimerBarSpacer } from '@/components/CookTimerBar';
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
  const { getRecipe, loading: recipesLoading } = useRecipes();
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

  const stepTimerSeconds = useMemo(() => {
    if (step?.timerSeconds && step.timerSeconds > 0) return step.timerSeconds;
    if (stepIndex === 0 && (recipe?.cookMinutes ?? 0) > 0) return (recipe?.cookMinutes ?? 0) * 60;
    return undefined;
  }, [step, stepIndex, recipe?.cookMinutes]);

  if (recipesLoading) {
    return (
      <View style={styles.missing}>
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  }

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

      <ScrollView
        style={styles.stepScroll}
        contentContainerStyle={styles.stepScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <RecipeCoverImage recipe={recipe} style={styles.heroPhoto} rounded={radius.lg} iconSize={40} />
        <Glass variant="card" style={styles.stepCard}>
          <View style={styles.stepCardInner}>
            <View style={[styles.stepBadge, { backgroundColor: colors.orange }]}>
              <AppText variant="label" style={{ color: colors.onAccent }}>
                {stepIndex + 1}
              </AppText>
            </View>
            <AppText style={styles.stepTextInCard}>{step.text}</AppText>
            {stepTimerSeconds != null && stepTimerSeconds > 0 ? (
              <CookTimerBlock
                timerKey={`${recipe.id}-${stepIndex}`}
                timerSeconds={stepTimerSeconds}
                timerLabel={`${recipe.title} · ขั้น ${stepIndex + 1}`}
                autoStart={autoStartTimers}
                onComplete={onTimerDone}
              />
            ) : null}
            {stepIndex < steps.length - 1 ? (
              <AppText variant="caption" muted style={styles.nextPreview}>
                ถัดไป: {steps[stepIndex + 1]?.text}
              </AppText>
            ) : null}
          </View>
        </Glass>
      </ScrollView>

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
  const {
    getTimer,
    remainingSeconds,
    startTimer,
    pauseTimer,
    resumeTimer,
  } = useCookTimers();
  const timer = getTimer(timerKey);
  const remaining = timer ? remainingSeconds(timerKey) : timerSeconds;
  const progress = timerSeconds > 0 ? 1 - remaining / timerSeconds : 0;
  const running = Boolean(timer && !timer.finished && timer.endAt > 0 && timer.pausedRemaining == null);
  const paused = Boolean(timer && timer.pausedRemaining != null && !timer.finished);
  const finished = Boolean(timer?.finished);
  const autoStarted = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    autoStarted.current = false;
  }, [timerKey, timerSeconds]);

  useEffect(() => {
    if (!autoStart || autoStarted.current || timerSeconds <= 0) return;
    if (!getTimer(timerKey)) {
      autoStarted.current = true;
      startTimer(timerKey, timerLabel, timerSeconds);
    }
  }, [autoStart, timerKey, timerSeconds, timerLabel, getTimer, startTimer]);

  useEffect(() => {
    if (finished) onCompleteRef.current?.();
  }, [finished]);

  const toggleTimer = () => {
    if (finished) return;
    if (running) {
      pauseTimer(timerKey);
      return;
    }
    if (paused) {
      resumeTimer(timerKey);
      return;
    }
    startTimer(timerKey, timerLabel, timerSeconds);
  };

  return (
    <View style={styles.timerCard}>
      <ProgressRing
        size={84}
        progress={Math.min(1, Math.max(0, progress))}
        color={colors.orange}
        center={
          <AppText variant="label" style={{ fontFamily: fonts.semiBold }}>
            {formatTimerSeconds(remaining)}
          </AppText>
        }
      />
      <View style={styles.timerMeta}>
        <AppText variant="label">ตัวจับเวลา</AppText>
        <AppText variant="caption" muted>
          {formatTimerSeconds(timerSeconds)}
          {running ? ' · แตะหยุด' : paused ? ' · หยุดชั่วคราว' : ''}
        </AppText>
      </View>
      <Pressable
        onPress={toggleTimer}
        style={styles.timerPauseBtn}
        accessibilityLabel={running ? 'หยุดตัวจับเวลา' : 'เริ่มตัวจับเวลา'}
      >
        <Ionicons
          name={running ? 'pause' : 'play'}
          size={22}
          color={colors.onAccent}
        />
      </Pressable>
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
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  timerMeta: { flex: 1, gap: 4, minWidth: 0 },
  timerPauseBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeTitle: { marginBottom: spacing.sm },
  stepScroll: { flex: 1 },
  stepScrollContent: { gap: spacing.md, paddingBottom: spacing.xl },
  heroPhoto: { width: '100%', height: 160 },
  stepCard: { width: '100%' },
  stepCardInner: { padding: spacing.md, gap: spacing.md },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextInCard: {
    fontSize: 18,
    lineHeight: 28,
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
