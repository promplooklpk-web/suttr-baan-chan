import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export default function AboutScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        padding: spacing.md,
        paddingBottom: insets.bottom + spacing.xl,
      }}
    >
      <AppText variant="title" style={{ marginBottom: spacing.md }}>สูตรบ้านฉัน</AppText>
      <AppText style={styles.p}>
        แอปเก็บสูตรอาหารไทยแบบ local-first ไม่ต้องล็อกอิน ข้อมูลอยู่ในเครื่องของคุณ
      </AppText>
      <AppText variant="label" style={styles.h}>เครดิตรูปตัวอย่าง</AppText>
      <AppText style={styles.p}>
        สูตรตัวอย่างใช้รูปจาก Wikimedia Commons และแหล่งอื่น ภายใต้สัญญาอนุญาต CC0, CC BY 2.0,
        CC BY-SA 2.0 และ CC BY-SA 4.0 รายละเอียดอยู่ใน assets/seed/onedish/ATTRIBUTION.md
        และในแต่ละหน้ารายละเอียดสูตร
      </AppText>
      <AppText variant="label" style={styles.h}>เทคโนโลยี</AppText>
      <AppText style={styles.p}>Expo SDK 57 · React Native · Expo Router</AppText>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  p: { lineHeight: 24, marginBottom: spacing.md },
  h: { marginBottom: spacing.sm },
});
