import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Glass } from '@/components/Glass';
import { GlassBottomBar } from '@/components/GlassBottomBar';
import { ProgressRing } from '@/components/ProgressRing';
import { RecipeCoverImage } from '@/components/RecipeCoverImage';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRecipes } from '@/context/RecipesContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { recordBackupNow } from '@/lib/backupReminder';
import { createExportZip, shareExportFile } from '@/lib/export/exportZip';
import { shareRecipeJsonExport } from '@/lib/export/exportRecipeJson';
import { parseRecipeCalories } from '@/lib/recipeMedia';
import { totalMinutes } from '@/lib/storage';

export default function ExportSelectScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { recipes } = useRecipes();
  const { showErrorSnackbar, showSnackbar } = useSnackbar();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionError, setSelectionError] = useState('');

  const selectedRecipes = useMemo(
    () => recipes.filter((r) => selected.has(r.id)),
    [recipes, selected],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(recipes.map((r) => r.id)));
    setSelectionError('');
  };

  const ensureSelection = () => {
    if (selectedRecipes.length === 0) {
      setSelectionError('กรุณาเลือกอย่างน้อย 1 สูตร');
      return false;
    }
    setSelectionError('');
    return true;
  };

  const progress = recipes.length > 0 ? selected.size / recipes.length : 0;

  return (
    <>
      <Stack.Screen options={{ title: 'เลือกสูตรส่งออก' }} />
      <View style={styles.screen}>
        {selectionError ? (
          <AppText variant="caption" style={styles.selectionError}>{selectionError}</AppText>
        ) : null}
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 140 }]}
          ListHeaderComponent={
            <Glass variant="card" style={styles.summaryCard}>
              <View style={styles.summaryInner}>
                <ProgressRing
                  size={72}
                  progress={progress}
                  color={colors.orange}
                  center={
                    <AppText variant="caption" style={{ fontFamily: fonts.semiBold }}>
                      {selected.size}/{recipes.length || 0}
                    </AppText>
                  }
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="label">เลือกแล้ว {selected.size} สูตร</AppText>
                  <AppText variant="caption" muted>
                    ไฟล์ .zip พร้อมรูป
                  </AppText>
                </View>
                <Pressable onPress={selectAll} hitSlop={8}>
                  <AppText variant="caption" style={{ color: colors.orange, fontFamily: fonts.semiBold }}>
                    เลือกทั้งหมด
                  </AppText>
                </Pressable>
              </View>
            </Glass>
          }
          renderItem={({ item }) => {
            const on = selected.has(item.id);
            const kcal = parseRecipeCalories(item);
            const mins = totalMinutes(item);
            return (
              <Pressable style={styles.row} onPress={() => toggle(item.id)}>
                <RecipeCoverImage recipe={item} style={styles.thumb} rounded={radius.md} iconSize={24} />
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="label" numberOfLines={2}>
                    {item.title}
                  </AppText>
                  <AppText variant="caption" muted>
                    {[kcal != null ? `${kcal} kcal` : null, mins ? `${mins} นาที` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </AppText>
                </View>
                <Ionicons
                  name={on ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={on ? colors.orange : colors.inkMuted}
                />
              </Pressable>
            );
          }}
        />
        <GlassBottomBar>
          <View style={styles.footerRow}>
            <Pressable
              style={styles.btnSecondary}
              onPress={async () => {
                if (!ensureSelection()) return;
                try {
                  await shareRecipeJsonExport(selectedRecipes);
                } catch (e) {
                  showErrorSnackbar(e instanceof Error ? e.message : 'ส่งออกไม่สำเร็จ');
                }
              }}
            >
              <AppText style={styles.btnSecondaryText}>.recipe.json</AppText>
            </Pressable>
            <Pressable
              style={styles.btnPrimary}
              onPress={async () => {
                if (!ensureSelection()) return;
                try {
                  const path = await createExportZip(selectedRecipes);
                  const shared = await shareExportFile(path, 'application/zip');
                  if (shared) {
                    await recordBackupNow();
                    showSnackbar('ส่งออกไฟล์สำรองแล้ว');
                  } else {
                    showSnackbar('ยกเลิกการส่งออก — ยังไม่บันทึกวันสำรอง');
                  }
                } catch (e) {
                  showErrorSnackbar(e instanceof Error ? e.message : 'ส่งออกไม่สำเร็จ');
                }
              }}
            >
              <Ionicons name="archive-outline" size={18} color={colors.onAccent} />
              <AppText style={styles.btnPrimaryText}>ส่งออก .zip ({selected.size})</AppText>
            </Pressable>
          </View>
          <Pressable onPress={() => router.back()} style={styles.cancelHit}>
            <AppText variant="caption" muted>
              ยกเลิก
            </AppText>
          </Pressable>
        </GlassBottomBar>
      </View>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.cream },
    selectionError: {
      color: colors.danger,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
    list: { padding: spacing.md },
    summaryCard: { marginBottom: spacing.md },
    summaryInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: radius.card,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    thumb: { width: 48, height: 48 },
    footerRow: { flexDirection: 'row', gap: spacing.sm },
    btnPrimary: {
      flex: 1.4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: colors.orange,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
    },
    btnPrimaryText: { color: colors.onAccent, fontFamily: fonts.semiBold, fontSize: 16 },
    btnSecondary: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface2,
    },
    btnSecondaryText: { color: colors.ink, fontFamily: fonts.semiBold, fontSize: 16 },
    cancelHit: { alignItems: 'center', marginTop: spacing.sm },
  });