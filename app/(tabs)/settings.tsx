import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { BackupNudgeBanner } from '@/components/BackupNudgeBanner';
import { ConfirmModal } from '@/components/ConfirmModal';
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
import { loadAppSettings, saveAppSettings } from '@/lib/appSettings';
import {
  cancelExpiryReminder,
  syncExpiryReminderSchedule,
} from '@/lib/expiryNotifications';
import { useSnackbar } from '@/context/SnackbarContext';
import { recordBackupNow } from '@/lib/backupReminder';

const APP_VERSION = '2.4.0';

export default function SettingsScreen() {
  const styles = useThemedStyles(createStyles);
  const { preference, setPreference, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { recipes, refresh } = useRecipes();
  const { items: fridgeItems } = useFridge();
  const { refresh: refreshPlan } = useMealPlan();
  const { refresh: refreshFridge } = useFridge();
  const { showSnackbar, showErrorSnackbar } = useSnackbar();
  const [kcalGoal, setKcalGoal] = useState('1800');
  const [kcalError, setKcalError] = useState('');
  const [expiryOn, setExpiryOn] = useState(false);
  const [cookAutoTimers, setCookAutoTimers] = useState(false);
  const [backupNudgeOn, setBackupNudgeOn] = useState(true);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [backupBannerKey, setBackupBannerKey] = useState(0);

  useEffect(() => {
    loadAppSettings().then((s) => {
      setKcalGoal(String(s.dailyKcalGoal));
      setExpiryOn(s.expiryRemindersEnabled);
      setCookAutoTimers(s.cookAutoStartTimers);
      setBackupNudgeOn(s.backupNudgeEnabled);
    });
  }, []);

  const saveKcalGoal = async () => {
    const n = parseInt(kcalGoal, 10);
    if (!Number.isFinite(n) || n < 500 || n > 6000) {
      setKcalError('ใส่ตัวเลขระหว่าง 500–6000');
      return;
    }
    setKcalError('');
    await saveAppSettings({ dailyKcalGoal: n });
    showSnackbar('บันทึกเป้าแคลต่อวันแล้ว');
  };

  const toggleExpiry = async (value: boolean) => {
    if (value) {
      const Notifications = await import('expo-notifications');
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        showErrorSnackbar('เปิดการแจ้งเตือนในระบบเพื่อเตือนของใกล้หมดอายุ');
        return;
      }
    }
    setExpiryOn(value);
    await saveAppSettings({ expiryRemindersEnabled: value });
    if (value) await syncExpiryReminderSchedule(fridgeItems);
    else await cancelExpiryReminder();
    showSnackbar(value ? 'เปิดเตือนหมดอายุ 09:00 น.' : 'ปิดเตือนหมดอายุแล้ว');
  };

  const exportAllZip = async () => {
    try {
      const path = await createFullBackupZip(recipes);
      await shareExportFile(path, 'application/zip');
      await recordBackupNow();
      setBackupBannerKey((k) => k + 1);
      showSnackbar('ส่งออกไฟล์สำรองแล้ว');
    } catch (e) {
      showErrorSnackbar(e instanceof Error ? e.message : 'ส่งออกไม่สำเร็จ');
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
        showErrorSnackbar(parsed.errors.join(' · '));
        return;
      }
      const plans = buildImportPlan(parsed.envelope.recipes, recipes);
      setPendingImport(
        parsed.envelope,
        plans,
        parsed.zip,
        parsed.zipUri,
        parsed.skippedRecipeCount,
      );
      router.push('/import/preview');
    } catch {
      showErrorSnackbar('ไฟล์เสียหายหรือไม่ใช่ไฟล์สำรองของแอป');
    }
  };

  const runClearAll = async () => {
    await clearAllAppData();
    await refresh();
    await refreshPlan();
    await refreshFridge();
    setConfirmClearAll(false);
    showSnackbar('ล้างข้อมูลแล้ว — โหลดชุดตัวอย่างใหม่');
  };

  return (
    <ScreenShell>
      <ConfirmModal
        visible={confirmClearAll}
        title="ล้างข้อมูลทั้งหมด?"
        message="การกระทำนี้ไม่สามารถย้อนกลับได้"
        confirmLabel="ล้าง"
        destructive
        onCancel={() => setConfirmClearAll(false)}
        onConfirm={() => void runClearAll()}
      />
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

        <BackupNudgeBanner key={backupBannerKey} onExportPress={() => void exportAllZip()} />

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

        <Section title="แพลนและทำอาหาร">
          <View style={styles.kcalRow}>
            <View style={styles.rowText}>
              <AppText variant="label">เป้าแคลต่อวัน</AppText>
              <AppText variant="caption" muted>แสดงในแพลนมื้อ</AppText>
            </View>
            <View>
              <TextInput
                value={kcalGoal}
                onChangeText={(v) => {
                  setKcalGoal(v);
                  if (kcalError) setKcalError('');
                }}
                keyboardType="number-pad"
                style={[styles.kcalInput, kcalError ? styles.kcalInputError : null]}
                onEndEditing={saveKcalGoal}
              />
              {kcalError ? (
                <AppText variant="caption" style={styles.fieldError}>{kcalError}</AppText>
              ) : null}
            </View>
          </View>
          <View style={styles.switchRow}>
            <View style={styles.rowText}>
              <AppText variant="label">เตือนให้สำรองข้อมูล</AppText>
              <AppText variant="caption" muted>แสดงเมื่อไม่ได้สำรองเกิน 7 วัน</AppText>
            </View>
            <Switch
              value={backupNudgeOn}
              onValueChange={async (v) => {
                setBackupNudgeOn(v);
                await saveAppSettings({ backupNudgeEnabled: v });
                setBackupBannerKey((k) => k + 1);
              }}
              trackColor={{ true: colors.orange, false: colors.border }}
            />
          </View>
          <View style={styles.switchRow}>
            <View style={styles.rowText}>
              <AppText variant="label">เตือนของใกล้หมดอายุ</AppText>
              <AppText variant="caption" muted>ทุกวัน 09:00 · แตะเปิดมุมมองใช้ของก่อน</AppText>
            </View>
            <Switch
              value={expiryOn}
              onValueChange={toggleExpiry}
              trackColor={{ true: colors.orange, false: colors.border }}
            />
          </View>
          <View style={styles.switchRow}>
            <View style={styles.rowText}>
              <AppText variant="label">เริ่มจับเวลาขั้นตอนอัตโนมัติ</AppText>
              <AppText variant="caption" muted>ในโหมดทำอาหาร</AppText>
            </View>
            <Switch
              value={cookAutoTimers}
              onValueChange={async (v) => {
                setCookAutoTimers(v);
                await saveAppSettings({ cookAutoStartTimers: v });
              }}
              trackColor={{ true: colors.orange, false: colors.border }}
            />
          </View>
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
            onPress={() => setConfirmClearAll(true)}
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  statNumber: { fontFamily: fonts.bold, fontSize: 28, color: colors.ink },
  statNumberAccent: { fontFamily: fonts.bold, fontSize: 28, color: colors.orange },
  themeSegmentPad: { padding: spacing.md },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  kcalInput: {
    minWidth: 88,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    color: colors.ink,
  },
  kcalInputError: {
    borderColor: colors.danger,
  },
  fieldError: {
    color: colors.danger,
    marginTop: 4,
    textAlign: 'right',
  },
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
    backgroundColor: colors.surface,
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
