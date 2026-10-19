import { Ionicons } from '@expo/vector-icons';
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
import { radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRecipes } from '@/context/RecipesContext';
import { createExportZip, shareExportFile } from '@/lib/export/exportZip';
import { shareRecipeJsonExport } from '@/lib/export/exportRecipeJson';

export default function ExportSelectScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { recipes } = useRecipes();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  const ensureSelection = () => {
    if (selectedRecipes.length === 0) {
      Alert.alert('เลือกสูตร', 'กรุณาเลือกอย่างน้อย 1 สูตร');
      return false;
    }
    return true;
  };

  return (
    <>
      <Stack.Screen options={{ title: 'เลือกสูตรส่งออก' }} />
      <View style={[styles.screen, { paddingBottom: insets.bottom + spacing.md }]}>
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const on = selected.has(item.id);
            return (
              <Pressable style={styles.row} onPress={() => toggle(item.id)}>
                <Ionicons
                  name={on ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={on ? colors.orange : colors.inkMuted}
                />
                <AppText style={styles.rowTitle}>{item.title}</AppText>
              </Pressable>
            );
          }}
        />
        <View style={styles.actions}>
          <Pressable
            style={styles.btn}
            onPress={async () => {
              if (!ensureSelection()) return;
              try {
                const path = await createExportZip(selectedRecipes);
                await shareExportFile(path, 'application/zip');
              } catch (e) {
                Alert.alert('ส่งออกไม่สำเร็จ', e instanceof Error ? e.message : '');
              }
            }}
          >
            <AppText style={styles.btnText}>ส่งออก .zip ({selected.size})</AppText>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnSecondary]}
            onPress={async () => {
              if (!ensureSelection()) return;
              try {
                await shareRecipeJsonExport(selectedRecipes);
              } catch (e) {
                Alert.alert('ส่งออกไม่สำเร็จ', e instanceof Error ? e.message : '');
              }
            }}
          >
            <AppText style={[styles.btnText, styles.btnTextSecondary]}>.recipe.json</AppText>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <AppText muted style={styles.cancel}>ยกเลิก</AppText>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  list: { padding: spacing.md, paddingBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTitle: { flex: 1 },
  actions: { paddingHorizontal: spacing.md, gap: spacing.sm },
  btn: {
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.orange,
  },
  btnText: { color: colors.surface, fontFamily: 'Sarabun_600SemiBold', fontSize: 16 },
  btnTextSecondary: { color: colors.orange },
  cancel: { textAlign: 'center', marginTop: spacing.sm },
});
