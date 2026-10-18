import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { stepPhotoMatchLabel } from '@/lib/stepPhotoLabels';
import { SHOW_STEP_PHOTOS } from '@/constants/featureFlags';
import { radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Recipe } from '@/types/recipe';

type RecipeAttributionProps = {
  recipe: Recipe;
};

export function RecipeAttribution({ recipe }: RecipeAttributionProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const hasCoverPhoto =
    recipe.photoCredit || recipe.photoLicense || recipe.photoSource;
  const hasSources = recipe.sources && recipe.sources.length > 0;
  const stepPhotos = SHOW_STEP_PHOTOS
    ? recipe.steps
        .map((step, index) => ({ step, index }))
        .filter(({ step }) => step.photo?.credit || step.photo?.license || step.photo?.source)
    : [];

  if (!hasCoverPhoto && !hasSources && stepPhotos.length === 0) return null;

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => undefined);
  };

  return (
    <View style={styles.box}>
      <AppText variant="label" style={styles.title}>แหล่งข้อมูลและเครดิตรูป</AppText>

      {hasCoverPhoto && (
        <View style={styles.block}>
          <AppText variant="caption" muted style={styles.subheading}>รูปหน้าปก</AppText>
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

      {SHOW_STEP_PHOTOS && stepPhotos.length > 0 && (
        <View style={styles.block}>
          <AppText variant="caption" muted style={styles.subheading}>รูปขั้นตอน</AppText>
          {stepPhotos.map(({ step, index }) => {
            const photo = step.photo!;
            return (
              <View key={index} style={styles.stepCredit}>
                <AppText variant="caption" muted>
                  ขั้นที่ {index + 1} ({stepPhotoMatchLabel(photo.match)})
                </AppText>
                {photo.credit ? (
                  <AppText variant="caption" muted>เครดิต: {photo.credit}</AppText>
                ) : null}
                {photo.license ? (
                  <AppText variant="caption" muted>สัญญาอนุญาต: {photo.license}</AppText>
                ) : null}
                {photo.source ? (
                  <Pressable onPress={() => openUrl(photo.source!)}>
                    <AppText variant="caption" style={styles.link} numberOfLines={2}>
                      แหล่งรูปภาพ
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  subheading: {
    fontFamily: 'Sarabun_600SemiBold',
    marginBottom: 2,
  },
  stepCredit: {
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
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
