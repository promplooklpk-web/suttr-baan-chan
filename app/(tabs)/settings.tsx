import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors, radius, spacing } from '@/constants/theme';
import { useRecipes } from '@/context/RecipesContext';
import { buildImportPlan } from '@/lib/export/applyImport';
import { createExportZip, shareExportFile } from '@/lib/export/exportZip';
import { shareRecipeJsonExport } from '@/lib/export/exportRecipeJson';
import { parseImportFile } from '@/lib/export/importParse';
import { setPendingImport } from '@/lib/export/importSession';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { recipes } = useRecipes();

  const exportAllZip = async () => {
    try {
      const path = await createExportZip(recipes);
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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + 120,
        paddingHorizontal: spacing.md,
      }}
    >
      <AppText variant="heading" style={styles.title}>ตั้งค่า</AppText>

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

      <Section title="นำเข้าสูตร">
        <Row
          icon="download-outline"
          label="นำเข้าจากไฟล์"
          subtitle=".zip หรือ .recipe.json"
          onPress={pickImport}
        />
      </Section>
    </ScrollView>
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
  screen: { flex: 1, backgroundColor: colors.cream },
  title: { marginBottom: spacing.lg },
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
