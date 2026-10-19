import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { HomeTopBar, homeTopBarClearance } from '@/components/HomeTopBar';
import { HomeFilterChips, type HomeFilterId } from '@/components/HomeFilterChips';
import { EmptyState } from '@/components/EmptyState';
import { RecipeMenuCard } from '@/components/RecipeMenuCard';
import { ScreenShell } from '@/components/ScreenShell';
import { spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRecipes } from '@/context/RecipesContext';
import { useFridgeRecipeMatches } from '@/hooks/useFridgeRecipeMatches';
import { scrollPaddingBottom } from '@/lib/screenLayout';
import { totalMinutes } from '@/lib/storage';

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
  const [filter, setFilter] = useState<HomeFilterId>('all');
  const fridgeMatches = useFridgeRecipeMatches(recipes);

  const filtered = useMemo(() => {
    let list = recipes;
    if (filter === 'ready') {
      list = list.filter((r) => (fridgeMatches.getPercent(r.id) ?? 0) >= 100);
    } else if (filter === 'quick') {
      list = list.filter((r) => totalMinutes(r) <= 15);
    } else if (filter === 'clean') {
      list = list.filter(
        (r) => r.category === 'อาหารคลีน' || r.tags?.includes('คลีน') === true,
      );
    }
    return list;
  }, [recipes, filter, fridgeMatches]);

  const headerClearance = homeTopBarClearance(insets.top);
  const bottomPadding = scrollPaddingBottom(insets.bottom);

  if (loading) {
    return (
      <ScreenShell>
        <HomeTopBar greeting={greeting()} />
        <View style={[styles.centered, { paddingTop: headerClearance }]}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <HomeTopBar greeting={greeting()} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerClearance, paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <HomeFilterChips selected={filter} onSelect={setFilter} />

        <View style={styles.sectionHeader}>
          <AppText variant="title" style={styles.sectionTitle}>สูตรของฉัน</AppText>
          <AppText variant="caption" muted testID="home-recipe-count">
            {filtered.length} สูตร
          </AppText>
        </View>

        {recipes.length === 0 ? (
          <EmptyState
            title="ยังไม่มีสูตร"
            subtitle="เริ่มเก็บสูตรอาหารที่บ้านไว้ในที่เดียว"
            showAdd
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="ยังไม่มีสูตรในตัวกรองนี้" showAdd />
        ) : (
          <View style={styles.listContent} testID="home-recipe-list">
            {filtered.map((item, index) => (
              <RecipeMenuCard
                key={item.id}
                recipe={item}
                layout="list"
                colorIndex={index}
                fridgeMatch={fridgeMatches.getMatch(item.id)}
                showFridgeSection={fridgeMatches.hasFridgeItems}
                testID="recipe-list-card"
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 0,
    alignItems: 'stretch',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 20,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
  },
});
