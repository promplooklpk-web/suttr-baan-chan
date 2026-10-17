import { Ionicons } from '@expo/vector-icons';
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
import { EmptyState } from '@/components/EmptyState';
import { RecipeCard } from '@/components/RecipeCard';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useRecipes } from '@/context/RecipesContext';

const POPULAR_TAGS = ['เผ็ด', 'จานด่วน', 'ทำง่าย', 'ผัด', 'ต้มยำ'];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { recipes, searchRecipes } = useRecipes();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);

  const results = useMemo(() => searchRecipes(query), [query, searchRecipes]);

  const onSubmit = () => {
    const q = query.trim();
    if (!q) return;
    setRecent((prev) => [q, ...prev.filter((x) => x !== q)].slice(0, 5));
  };

  const clearRecent = (item: string) => {
    setRecent((prev) => prev.filter((x) => x !== item));
  };

  const showResults = query.trim().length > 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <AppText variant="title">ค้นหา</AppText>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.inkMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSubmit}
          placeholder="ค้นหาจากชื่อสูตร ส่วนผสม แท็ก"
          placeholderTextColor={colors.inkLight}
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.inkMuted} />
          </Pressable>
        )}
      </View>

      {!showResults && (
        <View style={styles.suggestions}>
          {recent.length > 0 && (
            <View style={styles.block}>
              <AppText variant="label" style={styles.blockTitle}>ค้นล่าสุด</AppText>
              {recent.map((item) => (
                <Pressable
                  key={item}
                  style={styles.recentRow}
                  onPress={() => setQuery(item)}
                >
                  <Ionicons name="time-outline" size={18} color={colors.inkMuted} />
                  <AppText style={styles.recentText}>{item}</AppText>
                  <Pressable onPress={() => clearRecent(item)} hitSlop={8}>
                    <Ionicons name="close" size={18} color={colors.inkLight} />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.block}>
            <AppText variant="label" style={styles.blockTitle}>แท็กยอดนิยม</AppText>
            <View style={styles.tagRow}>
              {POPULAR_TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  style={styles.tag}
                  onPress={() => setQuery(tag)}
                >
                  <AppText variant="label" style={{ color: colors.orange }}>#{tag}</AppText>
                </Pressable>
              ))}
            </View>
          </View>

          {recipes.length > 0 && (
            <View style={styles.block}>
              <AppText variant="label" style={styles.blockTitle}>พบในสูตรของคุณ</AppText>
              {recipes.slice(0, 3).map((r) => (
                <Pressable key={r.id} onPress={() => setQuery(r.title)} style={styles.suggestItem}>
                  <AppText>{r.title}</AppText>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {showResults && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.resultRow}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              title="ยังไม่มีสูตรที่ตรงกัน"
              subtitle="ลองค้นหาคำอื่น หรือเพิ่มสูตรใหม่"
              showAdd
            />
          }
          renderItem={({ item, index }) => (
            <View style={styles.resultItem}>
              <RecipeCard recipe={item} colorIndex={index} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: spacing.sm,
  },
  suggestions: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
  },
  block: {
    marginBottom: spacing.lg,
  },
  blockTitle: {
    marginBottom: spacing.sm,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  recentText: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestItem: {
    paddingVertical: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
  },
  resultRow: {
    gap: spacing.md,
  },
  resultItem: {
    flex: 1,
    marginBottom: spacing.md,
  },
});
