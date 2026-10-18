import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { HomeTopBar, homeTopBarClearance } from '@/components/HomeTopBar';
import { CategoryChips } from '@/components/CategoryChips';
import { EmptyState } from '@/components/EmptyState';
import { RecipeCard } from '@/components/RecipeCard';
import { FridgeEmptyHintChip, RecipeMenuCard } from '@/components/RecipeMenuCard';
import { RecipeCoverImage } from '@/components/RecipeCoverImage';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRecipes } from '@/context/RecipesContext';
import { useFridgeRecipeMatches } from '@/hooks/useFridgeRecipeMatches';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'สวัสดีตอนเช้า';
  if (hour < 15) return 'สวัสดีตอนเที่ยง';
  if (hour < 18) return 'สวัสดีตอนบ่าย';
  return 'สวัสดีตอนเย็น';
}

export default function HomeScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { recipes, loading } = useRecipes();
  const [category, setCategory] = useState('ทั้งหมด');
  const [fridgeSort, setFridgeSort] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'list' | 'compact'>('list');
  const fridgeMatches = useFridgeRecipeMatches(recipes);

  const favorites = useMemo(
    () => recipes.filter((r) => r.isFavorite),
    [recipes],
  );

  const pickerTeaser = useMemo(() => {
    if (recipes.length === 0) return null;
    const shuffled = [...recipes].sort(() => Math.random() - 0.5);
    return shuffled[0];
  }, [recipes]);

  const filtered = useMemo(() => {
    let list = recipes;
    if (category !== 'ทั้งหมด') {
      if (category === 'จานเดียว') {
        list = recipes.filter(
          (r) => r.category === 'อาหารจานเดียว' || r.category === 'จานเดียว',
        );
      } else {
        list = recipes.filter((r) => r.category === category);
      }
    }
    if (fridgeSort) {
      list = [...list].sort(
        (a, b) =>
          (fridgeMatches.getPercent(b.id) ?? 0) - (fridgeMatches.getPercent(a.id) ?? 0),
      );
    }
    return list;
  }, [recipes, category, fridgeSort, fridgeMatches]);

  const headerClearance = homeTopBarClearance(insets.top);

  if (loading) {
    return (
      <View style={styles.screen}>
        <HomeTopBar greeting={greeting()} title="สูตรบ้านฉัน" />
        <View style={[styles.centered, { paddingTop: headerClearance }]}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <HomeTopBar greeting={greeting()} title="สูตรบ้านฉัน" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerClearance }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText variant="heading" style={styles.pageTitle}>สูตรของฉัน</AppText>
          <AppText variant="caption" muted>{recipes.length} สูตร</AppText>
        </View>

        <Pressable
          style={styles.pickerPromo}
          onPress={() => router.push({ pathname: '/(tabs)/picker', params: { autoShuffle: '1' } })}
        >
          <View style={styles.pickerPromoContent}>
            <AppText variant="label" style={styles.pickerPromoTitle}>วันนี้กินอะไรดี?</AppText>
            <AppText variant="caption" muted>
              สุ่มเมนูจากสูตรที่เก็บไว้
            </AppText>
          </View>
          {pickerTeaser ? (
            <RecipeCoverImage recipe={pickerTeaser} style={styles.pickerThumb} rounded={radius.md} />
          ) : (
            <Ionicons name="shuffle" size={22} color={colors.orange} />
          )}
        </Pressable>

        <CategoryChips selected={category} onSelect={setCategory} />
        {fridgeMatches.hasFridgeItems && (
          <Pressable
            style={[styles.fridgeChip, fridgeSort && styles.fridgeChipOn]}
            onPress={() => setFridgeSort((v) => !v)}
          >
            <AppText variant="label" style={{ color: fridgeSort ? colors.white : colors.ink }}>
              ทำได้จากตู้เย็น
            </AppText>
          </Pressable>
        )}

        {recipes.length === 0 ? (
          <EmptyState
            title="ยังไม่มีสูตร"
            subtitle="เริ่มเก็บสูตรอาหารที่บ้านไว้ในที่เดียว"
            showAdd
          />
        ) : (
          <>
            {favorites.length > 0 && (
              <View style={styles.section}>
                <AppText variant="title" style={styles.sectionTitle}>สูตรโปรด</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.favRow}>
                    {favorites.map((recipe, i) => (
                      <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        variant="compact"
                        colorIndex={i}
                        fridgeMatchPercent={fridgeMatches.getPercent(recipe.id)}
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppText variant="title" style={styles.sectionTitleInline}>
                  {category === 'ทั้งหมด' ? 'สูตรของฉัน' : category}
                </AppText>
                <View style={styles.layoutToggle}>
                  <Pressable
                    accessibilityLabel="แสดงแบบรายการเต็มความกว้าง"
                    style={[styles.layoutBtn, layoutMode === 'list' && styles.layoutBtnOn]}
                    onPress={() => setLayoutMode('list')}
                  >
                    <Ionicons
                      name="list-outline"
                      size={20}
                      color={layoutMode === 'list' ? colors.white : colors.inkMuted}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="แสดงแบบกะทัดรัด"
                    style={[styles.layoutBtn, layoutMode === 'compact' && styles.layoutBtnOn]}
                    onPress={() => setLayoutMode('compact')}
                  >
                    <Ionicons
                      name="grid-outline"
                      size={18}
                      color={layoutMode === 'compact' ? colors.white : colors.inkMuted}
                    />
                  </Pressable>
                </View>
              </View>
              {!fridgeMatches.hasFridgeItems && (
                <FridgeEmptyHintChip onPress={() => router.push('/(tabs)/fridge')} />
              )}
              {filtered.length === 0 ? (
                <EmptyState title="ยังไม่มีสูตรในหมวดนี้" showAdd />
              ) : (
                <FlatList
                  key={layoutMode}
                  data={filtered}
                  keyExtractor={(item) => item.id}
                  numColumns={layoutMode === 'compact' ? 2 : 1}
                  scrollEnabled={false}
                  columnWrapperStyle={layoutMode === 'compact' ? styles.gridRow : undefined}
                  contentContainerStyle={styles.listContent}
                  renderItem={({ item, index }) => (
                    <View style={layoutMode === 'compact' ? styles.gridItem : styles.listItem}>
                      <RecipeMenuCard
                        recipe={item}
                        layout={layoutMode === 'compact' ? 'compact' : 'list'}
                        colorIndex={index}
                        fridgeMatch={fridgeMatches.getMatch(item.id)}
                        showFridgeSection={fridgeMatches.hasFridgeItems}
                      />
                    </View>
                  )}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  fridgeChip: {
    alignSelf: 'flex-start',
    marginLeft: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fridgeChipOn: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  header: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: 4,
  },
  pageTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  pickerPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  pickerPromoContent: { flex: 1, gap: 4 },
  pickerPromoTitle: { fontSize: 17 },
  pickerThumb: {
    width: 56,
    height: 56,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitleInline: {
    flex: 1,
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
  sectionTitle: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    gap: 0,
  },
  listItem: {
    width: '100%',
  },
  favRow: {
    flexDirection: 'row',
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
  gridRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  gridItem: {
    flex: 1,
  },
});
