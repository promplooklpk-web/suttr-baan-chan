import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/AppText';
import { PhotoGlassHero } from '@/components/PhotoGlassHero';
import { Glass } from '@/components/Glass';
import { ScreenShell } from '@/components/ScreenShell';
import { fonts, spacing } from '@/constants/theme';
import { screenTopPadding, scrollPaddingBottom } from '@/lib/screenLayout';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

const HERO_IMAGE = require('@/assets/seed/wl-grilled-chicken-breast.jpg');
const APP_ICON = require('@/assets/images/icon.png');

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
        <PhotoGlassHero imageSource={HERO_IMAGE} panelLayout="center" height={176}>
          <View style={styles.heroInner}>
            <View style={[styles.iconTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Image source={APP_ICON} style={styles.appIcon} contentFit="cover" />
            </View>
            <AppText variant="title">สูตรบ้านฉัน</AppText>
            <AppText variant="caption" muted>เวอร์ชัน 1.0.0</AppText>
            <View style={[styles.pill, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <AppText variant="micro" muted>
                local-first
              </AppText>
            </View>
          </View>
        </PhotoGlassHero>
        <Glass variant="card" style={styles.descCard}>
          <View style={styles.descInner}>
            <View style={[styles.infoTile, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={22} color={colors.ink} />
            </View>
            <AppText style={styles.p}>
              แอปเก็บสูตรอาหารไทยแบบ local-first ไม่ต้องล็อกอิน ข้อมูลอยู่ในเครื่องของคุณ
            </AppText>
          </View>
        </Glass>
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
        <View style={styles.techRow}>
          {['Expo SDK 57', 'React Native', 'Expo Router'].map((t) => (
            <View key={t} style={[styles.techChip, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <AppText variant="micro" muted>
                {t}
              </AppText>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.cream },
    heroInner: {
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
      overflow: 'hidden',
    },
    appIcon: { width: 48, height: 48, borderRadius: 12 },
    pill: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      marginTop: spacing.xs,
    },
    descCard: { marginTop: spacing.md, marginBottom: spacing.lg },
    descInner: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, alignItems: 'flex-start' },
    infoTile: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    p: { lineHeight: 22, marginBottom: spacing.md, fontFamily: fonts.regular, flex: 1 },
    h: { marginBottom: spacing.sm },
    techRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    techChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
    },
  });