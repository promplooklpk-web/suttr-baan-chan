import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'ยกเลิก',
  destructive,
  onCancel,
  onConfirm,
}: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <AppText variant="title">{title}</AppText>
          <AppText muted style={styles.message}>{message}</AppText>
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <AppText variant="label">{cancelLabel}</AppText>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, destructive && styles.confirmDestructive]}
              onPress={onConfirm}
            >
              <AppText
                variant="label"
                style={{ color: destructive ? styles.destructiveText.color : styles.confirmText.color }}
              >
                {confirmLabel}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    sheet: {
      backgroundColor: colors.cream,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    message: { marginBottom: spacing.md },
    actions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
    cancelBtn: {
      minHeight: 44,
      paddingHorizontal: spacing.md,
      justifyContent: 'center',
    },
    confirmBtn: {
      minHeight: 44,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      backgroundColor: colors.orange,
      justifyContent: 'center',
    },
    confirmDestructive: {
      backgroundColor: colors.danger,
    },
    confirmText: { color: colors.onAccent, fontFamily: fonts.semiBold },
    destructiveText: { color: colors.surface, fontFamily: fonts.semiBold },
  });
