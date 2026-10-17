import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { CATEGORY_VALUES, colors, fonts, radius, spacing } from '@/constants/theme';
import { useRecipes } from '@/context/RecipesContext';
import { totalMinutes } from '@/lib/storage';
import type { Recipe } from '@/types/recipe';

function parseCalories(recipe: Recipe): number | null {
  const text = recipe.caloriesEstimate ?? recipe.notes ?? '';
  const match = text.match(/(\d+)\s*กิโลแคลอรี/);
  return match ? parseInt(match[1], 10) : null;
}

export default function PickerScreen() {
  const insets = useSafeAreaInsets();
  const { recipes } = useRecipes();
  const [category, setCategory] = useState<string>('ทั้งหมด');
  const [maxMinutes, setMaxMinutes] = useState<number | null>(null);
  const [maxCalories, setMaxCalories] = useState<number | null>(null);
  const [picked, setPicked] = useState<Recipe | null>(null);

  const pool = useMemo(() => {
    return recipes.filter((r) => {
      if (category !== 'ทั้งหมด' && r.category !== category) return false;
      const mins = totalMinutes(r);
      if (maxMinutes != null && mins > maxMinutes) return false;
      const cal = parseCalories(r);
      if (maxCalories != null && cal != null && cal > maxCalories) return false;
      if (maxCalories != null && cal == null) return false;
      return true;
    });
  }, [recipes, category, maxMinutes, maxCalories]);

  const randomPick = () => {
    if (pool.length === 0) {
      setPicked(null);
      return;
    }
    const idx = Math.floor(Math.random() * pool.length);
    setPicked(pool[idx]);
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 120 },
      ]}
    >
      <AppText variant="heading" style={styles.title}>วันนี้กินอะไรดี?</AppText>
      <AppText muted style={styles.subtitle}>สุ่มเมนูจากสูตรของคุณตามตัวกรอง</AppText>

      <View style={styles.filters}>
        <AppText variant="label">หมวดหมู่</AppText>
        <View style={styles.chipRow}>
          <Chip label="ทั้งหมด" active={category === 'ทั้งหมด'} onPress={() => setCategory('ทั้งหมด')} />
          {CATEGORY_VALUES.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>

        <AppText variant="label">เวลาทำ (นาที)</AppText>
        <View style={styles.chipRow}>
          {[null, 15, 30, 45].map((m) => (
            <Chip
              key={String(m)}
              label={m == null ? 'ไม่จำกัด' : `≤ ${m} น.`}
              active={maxMinutes === m}
              onPress={() => setMaxMinutes(m)}
            />
          ))}
        </View>

        <AppText variant="label">แคลอรี (ประมาณ)</AppText>
        <View style={styles.chipRow}>
          {[null, 300, 450, 600].map((c) => (
            <Chip
              key={String(c)}
              label={c == null ? 'ไม่จำกัด' : `≤ ${c}`}
              active={maxCalories === c}
              onPress={() => setMaxCalories(c)}
            />
          ))}
        </View>
      </View>

      <View style={styles.resultCard}>
        {picked ? (
          <>
            <Ionicons name="restaurant" size={40} color={colors.orange} />
            <AppText variant="title" style={styles.pickedTitle}>{picked.title}</AppText>
            <AppText muted>{totalMinutes(picked)} นาที · {picked.category}</AppText>
            <Pressable
              style={styles.detailBtn}
              onPress={() => router.push(`/recipe/${picked.id}`)}
            >
              <AppText style={styles.detailBtnText}>ดูสูตร</AppText>
            </Pressable>
          </>
        ) : (
          <AppText muted style={{ textAlign: 'center' }}>
            {pool.length === 0
              ? 'ไม่มีสูตรที่ตรงตัวกรอง'
              : 'กดปุ่มด้านล่างเพื่อสุ่มเมนู'}
          </AppText>
        )}
      </View>

      <Pressable style={styles.pickBtn} onPress={randomPick}>
        <Ionicons name="shuffle" size={22} color={colors.white} />
        <AppText style={styles.pickBtnText}>สุ่มเมนู ({pool.length})</AppText>
      </Pressable>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <AppText variant="caption" style={{ color: active ? colors.white : colors.ink }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.md,
  },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.lg },
  filters: { gap: spacing.sm, marginBottom: spacing.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  resultCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pickedTitle: { textAlign: 'center' },
  detailBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.orange,
  },
  detailBtnText: { color: colors.orange, fontFamily: fonts.semiBold },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  pickBtnText: { color: colors.white, fontFamily: fonts.semiBold, fontSize: 18 },
});
