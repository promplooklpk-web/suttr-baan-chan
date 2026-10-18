import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { recipeCoverUri } from '@/lib/recipeMedia';
import type { Recipe } from '@/types/recipe';

type RecipeCoverImageProps = {
  recipe: Recipe;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  rounded?: number;
};

export function RecipeCoverImage({
  recipe,
  style,
  iconSize = 40,
  rounded = radius.lg,
}: RecipeCoverImageProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const uri = recipeCoverUri(recipe);

  return (
    <View style={[styles.wrap, { borderRadius: rounded }, style]}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={styles.fallback}>
          <Ionicons name="restaurant" size={iconSize} color={colors.orange} />
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.imagePlaceholder,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.imagePlaceholder,
  },
});
