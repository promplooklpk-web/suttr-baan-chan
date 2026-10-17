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
import { CategoryChips } from '@/components/CategoryChips';
import { EmptyState } from '@/components/EmptyState';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeCoverImage } from '@/components/RecipeCoverImage';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useRecipes } from '@/context/RecipesContext';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'สวัสดีตอนเช้า';
  if (hour < 15) return 'สวัสดีตอนเที่ยง';
  if (hour < 18) return 'สวัสดีตอนบ่าย';
  return 'สวัสดีตอนเย็น';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { recipes, loading } = useRecipes();
  const [category, setCategory] = useState('ทั้งหมด');

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
    if (category === 'ทั้งหมด') return recipes;
    if (category === 'จานเดียว') {
      return recipes.filter(
        (r) => r.category === 'อาหารจานเดียว' || r.category === 'จานเดียว',
      );
    }
    return recipes.filter((r) => r.category === category);
  }, [recipes, category]);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText variant="caption" muted>{greeting()}</AppText>
          <AppText variant="heading">วันนี้ทำอะไรกินดี?</AppText>
        </View>

        <View style={styles.pickerPromo}>
          <View style={styles.pickerPromoContent}>
            <View style={styles.newBadge}>
              <AppText variant="caption" style={styles.newBadgeText}>ใหม่</AppText>
            </View>
            <AppText variant="label" style={styles.pickerPromoTitle}>วันนี้กินอะไรดี?</AppText>
            <AppText variant="caption" style={styles.pickerPromoSub}>
              ไม่รู้จะกินอะไร? ให้เราสุ่มจากสูตรที่คุณเก็บไว้
            </AppText>
            <Pressable
              style={styles.pickerPromoBtn}
              onPress={() => router.push({ pathname: '/(tabs)/picker', params: { autoShuffle: '1' } })}
            >
              <Ionicons name="shuffle" size={18} color={colors.orange} />
              <AppText style={styles.pickerPromoBtnText}>สุ่มเลย</AppText>
            </Pressable>
          </View>
          {pickerTeaser ? (
            <Pressable
              style={styles.pickerThumbWrap}
              onPress={() => router.push('/(tabs)/picker')}
            >
              <RecipeCoverImage recipe={pickerTeaser} style={styles.pickerThumb} rounded={radius.lg} />
            </Pressable>
          ) : null}
        </View>

        <Pressable style={styles.searchBar} onPress={() => router.push('/(tabs)/search')}>
          <Ionicons name="search" size={20} color={colors.inkMuted} />
          <AppText muted style={styles.searchPlaceholder}>
            ค้นหาจากชื่อสูตร ส่วนผสม แท็ก
          </AppText>
        </Pressable>

        <CategoryChips selected={category} onSelect={setCategory} />

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
                      <RecipeCard key={recipe.id} recipe={recipe} variant="compact" colorIndex={i} />
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <AppText variant="title" style={styles.sectionTitle}>
                {category === 'ทั้งหมด' ? 'สูตรทั้งหมด' : category}
              </AppText>
              {filtered.length === 0 ? (
                <EmptyState title="ยังไม่มีสูตรในหมวดนี้" showAdd />
              ) : (
                <FlatList
                  data={filtered}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  scrollEnabled={false}
                  columnWrapperStyle={styles.gridRow}
                  renderItem={({ item, index }) => (
                    <View style={styles.gridItem}>
                      <RecipeCard recipe={item} colorIndex={index} />
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

const styles = StyleSheet.create({
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
  header: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  pickerPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.orange,
    borderRadius: radius.xl,
    padding: spacing.md,
    overflow: 'hidden',
  },
  pickerPromoContent: { flex: 1, gap: 4 },
  newBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardYellow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginBottom: 2,
  },
  newBadgeText: { fontFamily: fonts.semiBold, color: colors.ink, fontSize: 11 },
  pickerPromoTitle: { color: colors.white, fontSize: 18 },
  pickerPromoSub: { color: 'rgba(255,255,255,0.92)', marginBottom: spacing.sm },
  pickerPromoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  pickerPromoBtnText: { fontFamily: fonts.semiBold, color: colors.orange },
  pickerThumbWrap: {
    width: 88,
    height: 88,
  },
  pickerThumb: {
    width: 88,
    height: 88,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: fonts.regular,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
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
