import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Glass } from '@/components/Glass';
import { fonts, spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type HomeHeroCardProps = {
  readyCount: number;
  fridgeItemCount: number;
  expiringCount: number;
};

export function HomeHeroCard({ readyCount, fridgeItemCount, expiringCount }: HomeHeroCardProps) {
  const styles = useThemedStyles(createStyles);
  const { colors, tokens } = useTheme();

  return (
    <Glass variant="card" style={styles.cardWrap}>
      <View style={styles.cardInner}>
        <View style={styles.topRow}>
          <View style={[styles.iconTile, { borderColor: colors.border, backgroundColor: colors.surface2 }]}>
            <Ionicons name="leaf-outline" size={22} color={tokens.accentText} />
          </View>
          <View style={styles.topText}>
            <AppText variant="caption" muted>
              ทำได้เลยจากของในตู้
            </AppText>
            <AppText style={[styles.bigNumber, { color: tokens.accentText }]}>{readyCount} เมนู</AppText>
          </View>
        </View>
        <AppText variant="caption" muted style={styles.subline}>
          ตู้เย็น {fridgeItemCount} รายการ · ใกล้หมดอายุ {expiringCount}
        </AppText>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/picker')}
          style={styles.cta}
        >
          <AppText variant="label" style={{ color: tokens.accentText }}>
            วันนี้กินอะไรดี?
          </AppText>
          <Ionicons name="arrow-forward" size={16} color={tokens.accentText} />
        </Pressable>
      </View>
    </Glass>
  );
}

const createStyles = () =>
  StyleSheet.create({
    cardWrap: {
      marginHorizontal: spacing.gutter,
      marginBottom: spacing.md,
    },
    cardInner: {
      padding: spacing.gutter,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    iconTile: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    topText: { flex: 1, gap: 2 },
    bigNumber: {
      fontSize: 28,
      fontFamily: fonts.display,
      lineHeight: 38,
    },
    subline: {
      marginTop: spacing.sm,
    },
    cta: {
      marginTop: spacing.md,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
  });