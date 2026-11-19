import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/AppText';
import { Glass } from '@/components/Glass';
import { ScreenShell } from '@/components/ScreenShell';
import { fonts, spacing } from '@/constants/theme';
import { screenTopPadding, scrollPaddingBottom } from '@/lib/screenLayout';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export default function AboutScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors, tokens } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScreenShell>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          padding: spacing.gutter,
          paddingTop: screenTopPadding(insets.top),
          paddingBottom: scrollPaddingBottom(insets.bottom),
        }}
      >
        <Glass variant="card" style={styles.hero}>
          <View style={styles.heroInner}>
            <View style={[styles.iconTile, { borderColor: colors.border, backgroundColor: colors.surface2 }]}>
              <Ionicons name="restaurant-outline" size={28} color={tokens.accentText} />
            </View>
            <AppText variant="title">สูตรบ้านฉัน</AppText>
            <AppText variant="caption" muted>เวอร์ชัน 1.0.0</AppText>
            <View style={[styles.pill, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <AppText variant="micro" muted>local-first</AppText>
            </View>
          </View>
        </Glass>
        <AppText style={styles.p}>
          แอปเก็บสูตรอาหารไทยแบบ local-first ไม่ต้องล็อกอิน ข้อมูลอยู่ในเครื่องของคุณ
        </AppText>
        <AppText variant="label" style={styles.h}>
          เครดิตรูปตัวอย่าง
        </AppText>
        <AppText style={styles.p}>
          สูตรตัวอย่างใช้รูปจาก Wikimedia Commons และแหล่งอื่น ภายใต้สัญญาอนุญาต CC0, CC BY 2.0,
          CC BY-SA 2.0 และ CC BY-SA 4.0 รายละเอียดอยู่ใน assets/seed/onedish/ATTRIBUTION.md
          และในแต่ละหน้ารายละเอียดสูตร
        </AppText>
        <AppText variant="label" style={styles.h}>
          เทคโนโลยี
        </AppText>
        <AppText style={styles.p}>Expo SDK 57 · React Native · Expo Router</AppText>
      </ScrollView>
    </ScreenShell>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.cream },
    hero: { marginBottom: spacing.lg },
    heroInner: {
      padding: spacing.gutter,
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconTile: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      marginBottom: spacing.xs,
    },
    pill: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      marginTop: spacing.xs,
    },
    p: { lineHeight: 22, marginBottom: spacing.md, fontFamily: fonts.regular },
    h: { marginBottom: spacing.sm },
  });