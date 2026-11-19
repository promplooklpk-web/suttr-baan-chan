import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { ScreenShell } from '@/components/ScreenShell';
import { scrollPaddingBottom, screenTopPadding } from '@/lib/screenLayout';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRecipes } from '@/context/RecipesContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { collectAllTags, removeTag, renameTag } from '@/lib/tags';
import { saveRecipes } from '@/lib/storage';
import type { Recipe } from '@/types/recipe';

export default function TagsManagementScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors, keyboardAppearance } = useTheme();
  const insets = useSafeAreaInsets();
  const { recipes, refresh } = useRecipes();
  const { showSnackbar } = useSnackbar();
  const tags = useMemo(() => collectAllTags(recipes), [recipes]);
  const tagUsage = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tags) {
      m.set(t, recipes.filter((r) => r.tags?.includes(t)).length);
    }
    return m;
  }, [tags, recipes]);
  const maxUsage = useMemo(() => Math.max(1, ...tagUsage.values()), [tagUsage]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (tag: string) => {
    setEditing(tag);
    setEditValue(tag);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const next = renameTag(recipes, editing, editValue);
    await saveRecipes(next);
    await refresh();
    setEditing(null);
  };

  const deleteTag = async (tag: string) => {
    const snapshot: Recipe[] = JSON.parse(JSON.stringify(recipes));
    const next = removeTag(recipes, tag);
    await saveRecipes(next);
    await refresh();
    showSnackbar(`ลบแท็ก "${tag}" แล้ว`, async () => {
      await saveRecipes(snapshot);
      await refresh();
    });
  };

  return (
    <ScreenShell>
    <FlatList
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: screenTopPadding(insets.top),
        paddingBottom: scrollPaddingBottom(insets.bottom),
        paddingHorizontal: spacing.md,
      }}
      data={tags}
      keyExtractor={(t) => t}
      ListHeaderComponent={
        <View>
          <AppText variant="caption" muted>
            {tags.length} แท็ก · {recipes.length} สูตร
          </AppText>
          <AppText variant="caption" muted style={styles.hint}>
            แก้ไขชื่อแท็กจะอัปเดตทุกสูตรที่ใช้แท็กนี้ แตะแท็กเพื่อกรองในหน้าค้นหา
          </AppText>
        </View>
      }
      ListEmptyComponent={<AppText muted>ยังไม่มีแท็ก</AppText>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          {editing === item ? (
            <View style={styles.editRow}>
              <TextInput
          keyboardAppearance={keyboardAppearance}
                value={editValue}
                onChangeText={setEditValue}
                style={styles.input}
                autoFocus
              />
              <Pressable onPress={saveEdit}>
                <AppText style={{ color: colors.orange }}>บันทึก</AppText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.row}>
              <Pressable
                style={styles.tagPress}
                onPress={() => router.push({ pathname: '/(tabs)/search', params: { tag: item } })}
              >
                <AppText variant="label">#{item}</AppText>
                <AppText variant="caption" muted>{tagUsage.get(item) ?? 0} สูตร</AppText>
                <View style={styles.usageBg}>
                  <View
                    style={[
                      styles.usageFill,
                      {
                        width: `${((tagUsage.get(item) ?? 0) / maxUsage) * 100}%`,
                        backgroundColor: colors.orange,
                      },
                    ]}
                  />
                </View>
              </Pressable>
              <Pressable onPress={() => startEdit(item)} style={styles.tagAction}>
                <AppText style={{ color: colors.orange }}>แก้ไข</AppText>
              </Pressable>
              <Pressable onPress={() => deleteTag(item)} style={styles.tagAction}>
                <AppText style={{ color: colors.danger }}>ลบ</AppText>
              </Pressable>
            </View>
          )}
        </View>
      )}
    />
    </ScreenShell>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  hint: { marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tagAction: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  tagPress: { flex: 1, gap: 4 },
  usageBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
    marginTop: 4,
  },
  usageFill: { height: 6, borderRadius: 3 },
  editRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
});
