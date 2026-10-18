import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { LinkPressable } from '@/components/LinkPressable';
import { radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  showAdd?: boolean;
};

export function EmptyState({ title, subtitle, showAdd }: EmptyStateProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Ionicons name="restaurant-outline" size={40} color={colors.inkLight} />
      </View>
      <AppText variant="title" style={styles.title}>{title}</AppText>
      {subtitle ? (
        <AppText muted style={styles.subtitle}>{subtitle}</AppText>
      ) : null}
      {showAdd && (
        <Link href="/recipe/edit" asChild>
          <LinkPressable style={styles.button}>
            <Ionicons name="add" size={20} color={colors.white} />
            <AppText style={styles.buttonText}>เพิ่มสูตรใหม่</AppText>
          </LinkPressable>
        </Link>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.orange,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  buttonText: {
    color: colors.white,
    fontFamily: 'Sarabun_600SemiBold',
    fontSize: 16,
  },
});
