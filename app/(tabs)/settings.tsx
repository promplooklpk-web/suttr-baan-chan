import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { FloatingHeader, floatingHeaderClearance } from '@/components/FloatingHeader';
import { colors, radius, spacing } from '@/constants/theme';
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

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { recipes, refresh } = useRecipes();
  const { refresh: refreshPlan } = useMealPlan();
  const { refresh: refreshFridge } = useFridge();

  const exportAllZip = async () => {
    try {
      const path = await createFullBackupZip(recipes);
      await shareExportFile(path, 'application/zip');
    } catch (e) {
      Alert.alert('ส่งออกไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    }
  };

  const exportAllJson = async () => {
    try {
      await shareRecipeJsonExport(recipes);
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

  const headerClearance = floatingHeaderClearance(insets.top);

  return (
    <View style={styles.screenWrap}>
      <FloatingHeader
        title="ตั้งค่า"
        actions={[
          {
            icon: 'information-circle-outline',
            accessibilityLabel: 'เกี่ยวกับและเครดิต',
            onPress: () => router.push('/about'),
          },
          {
            icon: 'download-outline',
            accessibilityLabel: 'นำเข้าจากไฟล์',
            onPress: pickImport,
          },
          {
            icon: 'archive-outline',
            accessibilityLabel: 'สำรองข้อมูล zip',
            onPress: exportAllZip,
          },
        ]}
      />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          paddingTop: headerClearance,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: spacing.md,
        }}
      >
      <Section title="ส่งออกสูตร">
        <Row
          icon="archive-outline"
          label="ส่งออกทั้งหมด (.zip)"
          subtitle={`${recipes.length} สูตร พร้อมรูป`}
          onPress={exportAllZip}
        />
        <Row
          icon="document-text-outline"
          label="ส่งออกทั้งหมด (.recipe.json)"
          subtitle="ไฟล์เดียว รูปฝัง base64"
          onPress={exportAllJson}
        />
        <Row
          icon="checkbox-outline"
          label="เลือกสูตรเพื่อส่งออก"
          subtitle="zip หรือ json"
          onPress={() => router.push('/export/select')}
        />
      </Section>

      <Section title="สูตรและแท็ก">
        <Row
          icon="pricetags-outline"
          label="จัดการแท็ก"
          subtitle="แก้ไข ลบ และกรองตามแท็ก"
          onPress={() => router.push('/tags/index')}
        />
        <Row
          icon="heart-outline"
          label="สูตรโปรด"
          subtitle="ดูในแท็บค้นหา (กรองโปรด)"
          onPress={() => router.push({ pathname: '/(tabs)/search', params: { favorites: '1' } })}
        />
      </Section>

      <Section title="สำรองและกู้คืน">
        <Row
          icon="cloud-upload-outline"
          label="สำรองข้อมูลทั้งหมด"
          subtitle="ส่งออก .zip (สูตร + รูป)"
          onPress={exportAllZip}
        />
        <Row
          icon="cloud-download-outline"
          label="กู้คืนจากไฟล์สำรอง"
          subtitle="นำเข้า .zip / .recipe.json"
          onPress={pickImport}
        />
        <Row
          icon="trash-outline"
          label="ล้างข้อมูลทั้งหมด"
          subtitle="สูตร แพลนมื้อ รายการซื้อของ — แล้วโหลด seed ใหม่"
          onPress={() => {
            Alert.alert(
              'ล้างข้อมูลทั้งหมด?',
              'การกระทำนี้ไม่สามารถย้อนกลับได้',
              [
                { text: 'ยกเลิก', style: 'cancel' },
                {
                  text: 'ล้าง',
                  style: 'destructive',
                  onPress: async () => {
                    await clearAllAppData();
                    await refresh();
                    await refreshPlan();
                    await refreshFridge();
                    Alert.alert('ล้างข้อมูลแล้ว', 'โหลดสูตรตัวอย่างใหม่แล้ว');
                  },
                },
              ],
            );
          }}
        />
      </Section>

      <Section title="นำเข้าสูตร">
        <Row
          icon="download-outline"
          label="นำเข้าจากไฟล์"
          subtitle=".zip หรือ .recipe.json"
          onPress={pickImport}
        />
      </Section>

      <Section title="เกี่ยวกับ">
        <Row
          icon="information-circle-outline"
          label="เกี่ยวกับและเครดิต"
          subtitle="ลิขสิทธิ์รูปตัวอย่าง"
          onPress={() => router.push('/about')}
        />
      </Section>
    </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.orange} />
      <View style={styles.rowText}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="caption" muted>{subtitle}</AppText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.inkMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenWrap: { flex: 1, backgroundColor: colors.cream },
  screen: { flex: 1 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { marginBottom: spacing.sm, fontSize: 18 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
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
