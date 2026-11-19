import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { GlassBottomBar } from '@/components/GlassBottomBar';
import { radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRecipes } from '@/context/RecipesContext';
import { applyImportPlan, type ImportPlan } from '@/lib/export/applyImport';
import { applyZipSideEffects, materializeRecipesFromZip } from '@/lib/export/applyImportZip';
import { clearPendingImport, getPendingImport } from '@/lib/export/importSession';
import { useFridge } from '@/context/FridgeContext';
import { useMealPlan } from '@/context/MealPlanContext';
import { useSnackbar } from '@/context/SnackbarContext';
import type { DuplicatePolicy } from '@/types/export';

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <View style={{ width: 4, height: 28, borderRadius: 2, backgroundColor: color }} />
      <AppText variant="title">{value}</AppText>
      <AppText variant="caption" muted>
        {label}
      </AppText>
    </View>
  );
}

const POLICY_LABELS: Record<DuplicatePolicy, string> = {
  skip: 'ข้าม',
  keep_both: 'เก็บทั้งคู่',
  replace: 'แทนที่',
};

export default function ImportPreviewScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { refresh } = useRecipes();
  const { refresh: refreshPlan } = useMealPlan();
  const { refresh: refreshFridge } = useFridge();
  const { showSnackbar, showErrorSnackbar } = useSnackbar();
  const pending = getPendingImport();
  const [plans, setPlans] = useState<ImportPlan[]>(pending?.plans ?? []);
  const [globalPolicy, setGlobalPolicy] = useState<DuplicatePolicy>('skip');

  const duplicateCount = useMemo(() => plans.filter((p) => p.isDuplicate).length, [plans]);

  if (!pending) {
    return (
      <View style={styles.empty}>
        <AppText>ไม่มีข้อมูลนำเข้า</AppText>
        <Pressable onPress={() => router.back()}>
          <AppText style={{ color: colors.orange }}>กลับ</AppText>
        </Pressable>
      </View>
    );
  }

  const applyGlobal = (policy: DuplicatePolicy) => {
    setGlobalPolicy(policy);
    setPlans((prev) =>
      prev.map((p) => (p.isDuplicate ? { ...p, policy } : p)),
    );
  };

  const setItemPolicy = (id: string, policy: DuplicatePolicy) => {
    setPlans((prev) =>
      prev.map((p) => (p.recipe.id === id ? { ...p, policy } : p)),
    );
  };

  const confirm = async () => {
    try {
      const pendingFull = getPendingImport();
      let plansToApply = plans;
      if (pendingFull?.zip) {
        const materialized = await materializeRecipesFromZip(
          pendingFull.zip,
          plans.map((p) => p.recipe),
        );
        plansToApply = plans.map((p, i) => ({ ...p, recipe: materialized[i] }));
      }
      const added = await applyImportPlan(plansToApply);
      if (pendingFull?.zip) {
        await applyZipSideEffects(pendingFull.zip);
      }
      clearPendingImport();
      await refresh();
      await refreshPlan();
      await refreshFridge();
      const skipped = pendingFull?.skippedRecipeCount ?? 0;
      const msg =
        skipped > 0
          ? `นำเข้า ${added} สูตร · ข้าม ${skipped} รายการที่ข้อมูลไม่ครบ`
          : `นำเข้า ${added} สูตรสำเร็จ`;
      showSnackbar(msg);
      router.replace('/(tabs)/settings');
    } catch (e) {
      showErrorSnackbar(e instanceof Error ? e.message : 'นำเข้าไม่สำเร็จ');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'ตรวจสอบก่อนนำเข้า' }} />
      <View style={[styles.screen, { paddingTop: spacing.md }]}>
        <View style={styles.statRow}>
          <StatTile label="สูตรใหม่" value={plans.filter((p) => !p.isDuplicate).length} color={colors.cardGreen} />
          <StatTile label="ซ้ำ" value={duplicateCount} color={colors.cardYellow} />
          <StatTile
            label="ข้าม"
            value={pending.skippedRecipeCount + plans.filter((p) => p.policy === 'skip' && p.isDuplicate).length}
            color={colors.inkMuted}
          />
        </View>
        <View style={styles.summary}>
          <AppText variant="caption" style={{ color: colors.danger, marginBottom: spacing.sm }}>
            การยืนยันจะแทนที่ข้อมูลตู้เย็น แผนมื้อ และรายการซื้อจากไฟล์สำรอง
          </AppText>
          <AppText variant="label">
            พบ {plans.length} สูตร · ซ้ำ {duplicateCount} รายการ
            {pending.skippedRecipeCount > 0
              ? ` · ข้าม ${pending.skippedRecipeCount} รายการที่ข้อมูลไม่ครบ`
              : ''}
          </AppText>
          {duplicateCount > 0 && (
            <View style={styles.policyRow}>
              <AppText variant="caption" muted>จัดการซ้ำทั้งหมด:</AppText>
              {(['skip', 'keep_both', 'replace'] as DuplicatePolicy[]).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => applyGlobal(p)}
                  style={[styles.chip, globalPolicy === p && styles.chipOn]}
                >
                  <AppText variant="caption" style={{ color: globalPolicy === p ? colors.surface : colors.ink }}>
                    {POLICY_LABELS[p]}
                  </AppText>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <FlatList
          data={plans}
          keyExtractor={(item) => item.recipe.id}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: insets.bottom + 100 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <AppText variant="label">{item.recipe.title}</AppText>
              {item.isDuplicate ? (
                <>
                  <AppText variant="caption" muted>ซ้ำกับสูตรในเครื่อง (id เดียวกัน)</AppText>
                  <View style={styles.policyRow}>
                    {(['skip', 'keep_both', 'replace'] as DuplicatePolicy[]).map((p) => (
                      <Pressable
                        key={p}
                        onPress={() => setItemPolicy(item.recipe.id, p)}
                        style={[styles.chip, item.policy === p && styles.chipOn]}
                      >
                        <AppText variant="caption" style={{ color: item.policy === p ? colors.surface : colors.ink }}>
                          {POLICY_LABELS[p]}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : (
                <AppText variant="caption" muted>สูตรใหม่ — จะเพิ่ม</AppText>
              )}
            </View>
          )}
        />

        <GlassBottomBar>
          <Pressable style={styles.confirmBtn} onPress={confirm}>
            <AppText style={styles.confirmText}>
              นำเข้า {plans.filter((p) => !(p.isDuplicate && p.policy === 'skip')).length} สูตร
            </AppText>
          </Pressable>
        </GlassBottomBar>
      </View>
    </>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  statRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  summary: { paddingHorizontal: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  policyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.cream,
  },
  confirmBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmText: { color: colors.surface, fontFamily: 'Sarabun_600SemiBold', fontSize: 18 },
});
