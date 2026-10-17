import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, radius, spacing } from '@/constants/theme';
import type { Recipe } from '@/types/recipe';

type RecipeAttributionProps = {
  recipe: Recipe;
};

export function RecipeAttribution({ recipe }: RecipeAttributionProps) {
  const hasPhoto =
    recipe.photoCredit || recipe.photoLicense || recipe.photoSource;
  const hasSources = recipe.sources && recipe.sources.length > 0;

  if (!hasPhoto && !hasSources) return null;

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => undefined);
  };

  return (
    <View style={styles.box}>
      <AppText variant="label" style={styles.title}>แหล่งข้อมูลและเครดิตรูป</AppText>

      {hasPhoto && (
        <View style={styles.block}>
          {recipe.photoCredit ? (
            <AppText variant="caption" muted>เครดิตรูป: {recipe.photoCredit}</AppText>
          ) : null}
          {recipe.photoLicense ? (
            <AppText variant="caption" muted>สัญญาอนุญาต: {recipe.photoLicense}</AppText>
          ) : null}
          {recipe.photoSource ? (
            <Pressable onPress={() => openUrl(recipe.photoSource!)}>
              <AppText variant="caption" style={styles.link} numberOfLines={2}>
                แหล่งรูปภาพ
              </AppText>
            </Pressable>
          ) : null}
        </View>
      )}

      {hasSources && (
        <View style={styles.block}>
          <AppText variant="caption" muted style={styles.sourcesLabel}>แหล่งสูตร</AppText>
          {recipe.sources!.map((url) => (
            <Pressable key={url} onPress={() => openUrl(url)} style={styles.sourceRow}>
              <AppText variant="caption" style={styles.link} numberOfLines={2}>{url}</AppText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    marginBottom: spacing.sm,
  },
  block: {
    gap: 4,
    marginBottom: spacing.sm,
  },
  sourcesLabel: {
    marginBottom: 2,
  },
  sourceRow: {
    paddingVertical: 2,
  },
  link: {
    color: colors.orange,
    textDecorationLine: 'underline',
  },
});
