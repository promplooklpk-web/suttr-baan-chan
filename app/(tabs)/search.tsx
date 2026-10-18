import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { FloatingHeader, floatingHeaderClearance } from '@/components/FloatingHeader';
import { EmptyState } from '@/components/EmptyState';
import { FridgeEmptyHintChip, RecipeMenuCard } from '@/components/RecipeMenuCard';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRecipes } from '@/context/RecipesContext';
import { useFridgeRecipeMatches } from '@/hooks/useFridgeRecipeMatches';

const POPULAR_TAGS = ['เผ็ด', 'จานด่วน', 'ทำง่าย', 'ผัด', 'ต้มยำ'];

export default function SearchScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors, keyboardAppearance } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tag?: string; favorites?: string; q?: string }>();
  const { recipes, searchRecipes } = useRecipes();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(params.favorites === '1');
  const [tagFilter, setTagFilter] = useState(params.tag ?? '');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (params.tag) {
      setTagFilter(params.tag);
      setQuery(params.tag);
    }
    if (params.q) {
      setQuery(params.q);
    }
    if (params.favorites === '1') setFavoritesOnly(true);
  }, [params.tag, params.favorites, params.q]);

  const fridgeMatches = useFridgeRecipeMatches(recipes);

  const results = useMemo(() => {
    let list = query.trim() ? searchRecipes(query) : recipes;
    if (favoritesOnly) list = list.filter((r) => r.isFavorite);
    if (tagFilter) list = list.filter((r) => r.tags?.includes(tagFilter));
    return list;
  }, [query, searchRecipes, recipes, favoritesOnly, tagFilter]);

  const onSubmit = () => {
    const q = query.trim();
    if (!q) return;
    setRecent((prev) => [q, ...prev.filter((x) => x !== q)].slice(0, 5));
  };

  const clearRecent = (item: string) => {
    setRecent((prev) => prev.filter((x) => x !== item));
  };

  const showResults = query.trim().length > 0 || favoritesOnly || Boolean(tagFilter);
  const headerClearance = floatingHeaderClearance(insets.top);

  return (
    <View style={styles.screen}>
      <FloatingHeader
        actions={[
          {
            icon: favoritesOnly ? 'heart' : 'heart-outline',
            accessibilityLabel: 'กรองสูตรโปรด',
            active: favoritesOnly,
            onPress: () => setFavoritesOnly((v) => !v),
          },
          {
            icon: 'pricetags-outline',
            accessibilityLabel: 'จัดการแท็ก',
            onPress: () => router.push('/tags'),
          },
          {
            icon: 'add',
            accessibilityLabel: 'เพิ่มสูตร',
            onPress: () => router.push('/recipe/edit'),
          },
        ]}
      />

      <View style={[styles.pageHeader, { paddingTop: headerClearance }]}>
        <AppText variant="heading" style={styles.pageTitle}>ค้นหา</AppText>
      </View>
      <View style={styles.filterRow}>
        {tagFilter ? (
          <Pressable style={styles.filterChipOn} onPress={() => setTagFilter('')}>
            <AppText variant="caption" style={{ color: colors.white }}>#{tagFilter} ×</AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.inkMuted} />
        <TextInput
          keyboardAppearance={keyboardAppearance}
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
        <>
          <View style={styles.resultsToolbar}>
            <View style={styles.layoutToggle}>
              <Pressable
                accessibilityLabel="แสดงเป็นตาราง"
                style={[styles.layoutBtn, layoutMode === 'grid' && styles.layoutBtnOn]}
                onPress={() => setLayoutMode('grid')}
              >
                <Ionicons
                  name="grid-outline"
                  size={18}
                  color={layoutMode === 'grid' ? colors.white : colors.inkMuted}
                />
              </Pressable>
              <Pressable
                accessibilityLabel="แสดงเป็นรายการ"
                style={[styles.layoutBtn, layoutMode === 'list' && styles.layoutBtnOn]}
                onPress={() => setLayoutMode('list')}
              >
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={layoutMode === 'list' ? colors.white : colors.inkMuted}
                />
              </Pressable>
            </View>
          </View>
          {!fridgeMatches.hasFridgeItems && results.length > 0 && (
            <FridgeEmptyHintChip onPress={() => router.push('/(tabs)/fridge')} />
          )}
          <FlatList
            key={layoutMode}
            data={results}
            keyExtractor={(item) => item.id}
            numColumns={layoutMode === 'grid' ? 2 : 1}
            columnWrapperStyle={layoutMode === 'grid' ? styles.resultRow : undefined}
            contentContainerStyle={[
              styles.listContent,
              layoutMode === 'list' && styles.listContentSingle,
            ]}
            ListEmptyComponent={
              <EmptyState
                title="ยังไม่มีสูตรที่ตรงกัน"
                subtitle="ลองค้นหาคำอื่น หรือเพิ่มสูตรใหม่"
                showAdd
              />
            }
            renderItem={({ item, index }) => (
              <View style={layoutMode === 'grid' ? styles.resultItem : styles.resultItemList}>
                <RecipeMenuCard
                  recipe={item}
                  layout={layoutMode === 'list' ? 'list' : 'compact'}
                  colorIndex={index}
                  fridgeMatch={fridgeMatches.getMatch(item.id)}
                  showFridgeSection={fridgeMatches.hasFridgeItems}
                />
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  pageHeader: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  pageTitle: { fontSize: 28, lineHeight: 34 },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipOn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.orange,
    borderWidth: 1,
    borderColor: colors.orange,
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
    paddingTop: spacing.sm,
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
  resultsToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  layoutToggle: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  layoutBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  layoutBtnOn: {
    backgroundColor: colors.orange,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
  },
  listContentSingle: {
    paddingTop: 0,
  },
  resultRow: {
    gap: spacing.md,
  },
  resultItem: {
    flex: 1,
  },
  resultItemList: {
    width: '100%',
    marginBottom: 0,
  },
});
