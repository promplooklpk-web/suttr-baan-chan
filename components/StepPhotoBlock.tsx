import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { stepPhotoMatchLabel } from '@/lib/stepPhotoLabels';
import { photoUri } from '@/lib/storage';
import type { RecipePhoto } from '@/types/recipe';

type StepPhotoBlockProps = {
  photo: RecipePhoto;
};

export function StepPhotoBlock({ photo }: StepPhotoBlockProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const uri = photoUri(photo.path);
  const insets = useSafeAreaInsets();
  const [enlarged, setEnlarged] = useState(false);

  if (!uri) return null;

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => undefined);
  };

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setEnlarged(true)} accessibilityLabel="ขยายรูปขั้นตอน">
        <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
      </Pressable>
      <AppText variant="caption" style={styles.matchLabel}>
        {stepPhotoMatchLabel(photo.match)}
      </AppText>
      {(photo.credit || photo.license) && (
        <AppText variant="caption" muted style={styles.creditLine}>
          {photo.credit ? `เครดิต: ${photo.credit}` : ''}
          {photo.credit && photo.license ? ' · ' : ''}
          {photo.license ? `สัญญาอนุญาต: ${photo.license}` : ''}
        </AppText>
      )}
      {photo.licenseUrl ? (
        <Pressable onPress={() => openUrl(photo.licenseUrl!)}>
          <AppText variant="caption" style={styles.link}>ดูสัญญาอนุญาต</AppText>
        </Pressable>
      ) : null}
      {photo.source ? (
        <Pressable onPress={() => openUrl(photo.source!)}>
          <AppText variant="caption" style={styles.link}>แหล่งรูปภาพ</AppText>
        </Pressable>
      ) : null}

      <Modal visible={enlarged} transparent animationType="fade" onRequestClose={() => setEnlarged(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEnlarged(false)}>
          <View style={[styles.modalContent, { paddingTop: insets.top + spacing.md }]}>
            <Image source={{ uri }} style={styles.fullImage} contentFit="contain" />
            <Pressable style={styles.closeBtn} onPress={() => setEnlarged(false)}>
              <AppText style={styles.closeText}>ปิด</AppText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
  },
  thumb: {
    width: '100%',
    height: 160,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
  matchLabel: {
    marginTop: spacing.xs,
    color: colors.orange,
    fontFamily: fonts.semiBold,
  },
  creditLine: {
    marginTop: 2,
  },
  link: {
    color: colors.orange,
    textDecorationLine: 'underline',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(58, 42, 32, 0.92)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '70%',
    borderRadius: radius.md,
  },
  closeBtn: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
  },
  closeText: {
    color: colors.surface,
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
});
