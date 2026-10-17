import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors, radius, spacing } from '@/constants/theme';
import { useRecipes } from '@/context/RecipesContext';
import { applyImportPlan, type ImportPlan } from '@/lib/export/applyImport';
import { clearPendingImport, getPendingImport } from '@/lib/export/importSession';
import type { DuplicatePolicy } from '@/types/export';

const POLICY_LABELS: Record<DuplicatePolicy, string> = {
  skip: 'ข้าม',
  keep_both: 'เก็บทั้งคู่',
  replace: 'แทนที่',
};

export default function ImportPreviewScreen() {
  const insets = useSafeAreaInsets();
  const { refresh } = useRecipes();
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
      const added = await applyImportPlan(plans);
      clearPendingImport();
      await refresh();
      Alert.alert('นำเข้าสำเร็จ', `เพิ่มหรืออัปเดต ${added} สูตร`, [
        { text: 'ตกลง', onPress: () => router.replace('/(tabs)/settings') },
      ]);
    } catch (e) {
      Alert.alert('นำเข้าไม่สำเร็จ', e instanceof Error ? e.message : '');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'ตรวจสอบก่อนนำเข้า' }} />
      <View style={[styles.screen, { paddingTop: spacing.md }]}>
        <View style={styles.summary}>
          <AppText variant="label">
            พบ {plans.length} สูตร · ซ้ำ {duplicateCount} รายการ
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
                  <AppText variant="caption" style={{ color: globalPolicy === p ? colors.white : colors.ink }}>
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
                        <AppText variant="caption" style={{ color: item.policy === p ? colors.white : colors.ink }}>
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

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable style={styles.confirmBtn} onPress={confirm}>
            <AppText style={styles.confirmText}>นำเข้าสูตร</AppText>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  summary: { paddingHorizontal: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  policyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  card: {
    backgroundColor: colors.white,
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
  confirmText: { color: colors.white, fontFamily: 'Sarabun_600SemiBold', fontSize: 18 },
});
