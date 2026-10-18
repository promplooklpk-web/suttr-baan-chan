import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { HomeTopBar, homeTopBarClearance } from '@/components/HomeTopBar';
import { CategoryChips } from '@/components/CategoryChips';
import { EmptyState } from '@/components/EmptyState';
import { RecipeMenuCard } from '@/components/RecipeMenuCard';
import { spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRecipes } from '@/context/RecipesContext';
import { useFridgeRecipeMatches } from '@/hooks/useFridgeRecipeMatches';
import { scrollPaddingBottom } from '@/lib/screenLayout';

const HOME_CHIP_CATEGORIES = ['ทั้งหมด', 'จานเดียว', 'ต้ม/แกง', 'ผัด/ทอด'];

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
  const fridgeMatches = useFridgeRecipeMatches(recipes);

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
    return list;
  }, [recipes, category]);

  const headerClearance = homeTopBarClearance(insets.top);
  const bottomPadding = scrollPaddingBottom(insets.bottom);
  const sectionTitle = category === 'ทั้งหมด' ? 'สูตรทั้งหมด' : category;

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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerClearance, paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <CategoryChips
          selected={category}
          onSelect={setCategory}
          categories={HOME_CHIP_CATEGORIES}
        />

        <View style={styles.sectionHeader}>
          <AppText variant="title" style={styles.sectionTitle}>{sectionTitle}</AppText>
          <AppText variant="caption" muted>{filtered.length} สูตร</AppText>
        </View>

        {recipes.length === 0 ? (
          <EmptyState
            title="ยังไม่มีสูตร"
            subtitle="เริ่มเก็บสูตรอาหารที่บ้านไว้ในที่เดียว"
            showAdd
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="ยังไม่มีสูตรในหมวดนี้" showAdd />
        ) : (
          <View style={styles.listContent}>
            {filtered.map((item, index) => (
              <RecipeMenuCard
                key={item.id}
                recipe={item}
                layout="list"
                colorIndex={index}
                fridgeMatch={fridgeMatches.getMatch(item.id)}
                showFridgeSection={fridgeMatches.hasFridgeItems}
              />
            ))}
          </View>
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
    flexGrow: 1,
    alignItems: 'stretch',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 20,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    width: '100%',
  },
});
