import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { ScreenShell } from '@/components/ScreenShell';
import { SegmentPills } from '@/components/SegmentPills';
import { radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRecipes } from '@/context/RecipesContext';
import { clearAllAppData } from '@/lib/clearData';
import { useMealPlan } from '@/context/MealPlanContext';
import { buildImportPlan } from '@/lib/export/applyImport';
import { createFullBackupZip } from '@/lib/export/backupZip';
import { shareExportFile } from '@/lib/export/exportZip';
import { useFridge } from '@/context/FridgeContext';
import { shareRecipeJsonExport } from '@/lib/export/exportRecipeJson';
import { parseImportFile } from '@/lib/export/importParse';
import { setPendingImport } from '@/lib/export/importSession';
import type { ThemePreference } from '@/lib/themeStorage';
import { fonts } from '@/constants/theme';
import { PROFILE_DISPLAY_NAME, profileAvatarInitial } from '@/lib/profile';
import { accentGlow } from '@/lib/design';
import { scrollPaddingBottom, screenTopPadding } from '@/lib/screenLayout';

const APP_VERSION = '2.4.0';

export default function SettingsScreen() {
  const styles = useThemedStyles(createStyles);
  const { preference, setPreference, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { recipes, refresh } = useRecipes();
  const { items: fridgeItems } = useFridge();
  const { refresh: refreshPlan } = useMealPlan();
  const { refresh: refreshFridge } = useFridge();
  const [expiryReminders, setExpiryReminders] = useState(true);

  const exportAllZip = async () => {
    try {
      const path = await createFullBackupZip(recipes);
      await shareExportFile(path, 'application/zip');
    } catch (e) {
      Alert.alert('ส่งออกไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    }
  };

  const pickImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/zip', 'application/json', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const parsed = await parseImportFile(asset.uri, asset.mimeType, asset.name);
      if (!parsed.ok) {
        Alert.alert('ไฟล์ไม่ถูกต้อง', parsed.errors.join('\n'));
        return;
      }
      const plans = buildImportPlan(parsed.envelope.recipes, recipes);
      setPendingImport(parsed.envelope, plans);
      router.push('/import/preview');
    } catch (e) {
      Alert.alert('นำเข้าไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <ScreenShell>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          paddingTop: screenTopPadding(insets.top),
          paddingBottom: scrollPaddingBottom(insets.bottom),
          paddingHorizontal: spacing.md,
        }}
      >
        <AppText variant="caption" muted>บัญชีและแอป</AppText>
        <AppText variant="heading" style={styles.settingsTitle}>ตั้งค่า</AppText>

        <Pressable
          style={[styles.profileCard, accentGlow(colors, false)]}
          onPress={() => router.push('/about')}
        >
          <View style={styles.avatarLarge}>
            <AppText style={styles.avatarLargeText}>{profileAvatarInitial()}</AppText>
          </View>
          <View style={styles.profileText}>
            <AppText variant="title">{PROFILE_DISPLAY_NAME}</AppText>
            <AppText variant="caption" muted>สมาชิกตั้งแต่ ก.ย. 2569</AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.inkMuted} />
        </Pressable>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, accentGlow(colors, false)]}>
            <AppText style={styles.statNumberAccent}>{recipes.length}</AppText>
            <AppText variant="caption" muted>สูตรของฉัน</AppText>
          </View>
          <View style={styles.statCard}>
            <AppText style={styles.statNumber}>{fridgeItems.length}</AppText>
            <AppText variant="caption" muted>ของในตู้เย็น</AppText>
          </View>
        </View>

        <Section title="การแจ้งเตือน">
          <View style={styles.switchRow}>
            <AppText variant="label">เตือนของใกล้หมดอายุ</AppText>
            <Switch
              value={expiryReminders}
              onValueChange={setExpiryReminders}
              trackColor={{ true: colors.orange, false: colors.border }}
            />
          </View>
          <Row
            icon="time-outline"
            label="เตือนล่วงหน้า"
            subtitle="3 วัน"
            onPress={() => Alert.alert('เตือนล่วงหน้า', 'ตั้งค่า 3 วัน (ค่าเริ่มต้น)')}
          />
        </Section>

        <Section title="ธีม">
          <View style={styles.themeSegmentPad}>
            <SegmentPills
              options={[
                { id: 'light', label: 'สว่าง' },
                { id: 'dark', label: 'มืด' },
                { id: 'system', label: 'ตามระบบ' },
              ]}
              value={preference}
              onChange={(id) => setPreference(id as ThemePreference)}
            />
          </View>
        </Section>

        <Section title="ข้อมูล">
          <Row
            icon="archive-outline"
            label="ส่งออกสูตร (.zip)"
            subtitle={`${recipes.length} สูตร พร้อมรูป`}
            onPress={exportAllZip}
          />
          <Row
            icon="download-outline"
            label="นำเข้าสูตร"
            subtitle=".zip หรือ .recipe.json"
            onPress={pickImport}
          />
          <Row
            icon="trash-outline"
            label="ล้างข้อมูลทั้งหมด"
            subtitle="โหลด seed ใหม่หลังล้าง"
            onPress={() => {
              Alert.alert('ล้างข้อมูลทั้งหมด?', 'การกระทำนี้ไม่สามารถย้อนกลับได้', [
                { text: 'ยกเลิก', style: 'cancel' },
                {
                  text: 'ล้าง',
                  style: 'destructive',
                  onPress: async () => {
                    await clearAllAppData();
                    await refresh();
                    await refreshPlan();
                    await refreshFridge();
                  },
                },
              ]);
            }}
          />
        </Section>

        <Section title="เกี่ยวกับ">
          <Row
            icon="information-circle-outline"
            label="เวอร์ชัน"
            subtitle={APP_VERSION}
            onPress={() => router.push('/about')}
            trailingText={APP_VERSION}
          />
        </Section>
      </ScrollView>
    </ScreenShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.section}>
      <AppText variant="title" style={styles.sectionTitle}>{title}</AppText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  label,
  subtitle,
  onPress,
  trailingText,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  onPress: () => void;
  trailingText?: string;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.orange} />
      <View style={styles.rowText}>
        <AppText variant="label">{label}</AppText>
        {!trailingText && <AppText variant="caption" muted>{subtitle}</AppText>}
      </View>
      {trailingText ? (
        <AppText variant="caption" muted>{trailingText}</AppText>
      ) : null}
      <Ionicons name="chevron-forward" size={20} color={colors.inkMuted} />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1 },
  settingsTitle: { fontSize: 28, lineHeight: 34, marginBottom: spacing.lg, marginTop: 4 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  avatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    color: colors.onAccent,
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  profileText: { flex: 1, gap: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  statNumber: { fontFamily: fonts.bold, fontSize: 28, color: colors.ink },
  statNumberAccent: { fontFamily: fonts.bold, fontSize: 28, color: colors.orange },
  themeSegmentPad: { padding: spacing.md },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: { marginBottom: spacing.sm, fontSize: 18 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1, gap: 2 },
});
