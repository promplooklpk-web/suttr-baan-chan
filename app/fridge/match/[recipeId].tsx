import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { GlassBottomBar } from '@/components/GlassBottomBar';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useFridge } from '@/context/FridgeContext';
import { useRecipes } from '@/context/RecipesContext';
import { useMealPlan } from '@/context/MealPlanContext';
import { matchRecipeToFridge, missingShoppingEntries } from '@/lib/fridgeMatch';
import { mergeIntoShoppingList } from '@/lib/shoppingList';
import { useSnackbar } from '@/context/SnackbarContext';

export default function FridgeMatchDetailScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const insets = useSafeAreaInsets();
  const [footerHeight, setFooterHeight] = useState(120);
  const { items } = useFridge();
  const { recipes } = useRecipes();
  const { refresh: refreshPlan } = useMealPlan();
  const { showSnackbar } = useSnackbar();
  const recipe = recipes.find((r) => r.id === recipeId);

  if (!recipe) {
    return (
      <View style={styles.centered}>
        <AppText>ไม่พบสูตร</AppText>
      </View>
    );
  }

  const match = matchRecipeToFridge(recipe, items);
  const have = match.details.filter((d) => d.have);
  const missing = match.details.filter((d) => !d.have);

  const addMissing = async () => {
    const entries = missingShoppingEntries(match, recipe).map((e) => ({
      ...e,
      sourceRecipeId: recipe.id,
    }));
    await mergeIntoShoppingList(entries);
    await refreshPlan();
    showSnackbar(`เพิ่มของที่ขาด ${entries.length} อย่างลงรายการซื้อของ`);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: footerHeight + insets.bottom + spacing.md,
        }}
      >
        <AppText variant="title">{recipe.title}</AppText>
        <AppText muted style={{ marginBottom: spacing.lg }}>
          มีในตู้ {match.haveCount}/{match.totalCount} ({match.percent}%)
        </AppText>

        <AppText variant="label" style={styles.section}>มีในตู้</AppText>
        {have.length === 0 ? (
          <AppText muted>ยังไม่มีส่วนผสมที่ตรงในตู้</AppText>
        ) : (
          have.map((d) => (
            <View key={d.ingredientName} style={styles.row}>
              <AppText style={styles.check}>✓</AppText>
              <View style={{ flex: 1 }}>
                <AppText>{d.ingredientName}</AppText>
                <AppText variant="caption" muted>
                  ต้องใช้ {[d.requiredAmount, d.requiredUnit].filter(Boolean).join(' ')}
                  {d.availableAmount != null
                    ? ` · มี ${d.availableAmount} ${d.availableUnit ?? ''}`
                    : ''}
                </AppText>
                {d.expiringSoon && (
                  <AppText variant="caption" style={{ color: colors.cardYellow }}>ใกล้หมดอายุ</AppText>
                )}
              </View>
            </View>
          ))
        )}

        <AppText variant="label" style={styles.section}>ขาด</AppText>
        {missing.length === 0 ? (
          <AppText muted>ครบทุกอย่าง</AppText>
        ) : (
          missing.map((d) => (
            <View key={d.ingredientName} style={styles.row}>
              <AppText style={styles.cross}>✕</AppText>
              <View style={{ flex: 1 }}>
                <AppText>{d.ingredientName}</AppText>
                <AppText variant="caption" style={{ color: colors.danger }}>
                  {d.expiredInFridge ? 'ในตู้หมดอายุแล้ว' : 'ยังไม่มีในตู้'}
                </AppText>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <GlassBottomBar onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
        {missing.length > 0 ? (
          <Pressable style={styles.primary} onPress={addMissing}>
            <Ionicons name="cart-outline" size={18} color={colors.onAccent} />
            <AppText style={styles.primaryText}>
              เพิ่มของที่ขาด {missing.length} อย่างลงรายการซื้อ
            </AppText>
          </Pressable>
        ) : (
          <Pressable style={styles.primary} onPress={() => router.push(`/recipe/cook/${recipe.id}`)}>
            <Ionicons name="play" size={18} color={colors.onAccent} />
            <AppText style={styles.primaryText}>เริ่มทำอาหาร</AppText>
          </Pressable>
        )}
      </GlassBottomBar>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: spacing.lg, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  check: { color: colors.cardGreen, fontFamily: fonts.bold },
  cross: { color: colors.danger, fontFamily: fonts.bold },
  primary: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.onAccent, fontFamily: fonts.semiBold, fontSize: 16 },
});