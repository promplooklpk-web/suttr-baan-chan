import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Glass } from '@/components/Glass';
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
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="ปิด" />
        <Glass variant="material" borderRadius={radius.sheet} style={styles.sheetWrap}>
          <View style={styles.sheetInner}>
            <AppText variant="title">{title}</AppText>
            <AppText muted style={styles.message}>
              {message}
            </AppText>
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
                  style={{
                    color: destructive ? styles.destructiveText.color : styles.confirmText.color,
                  }}
                >
                  {confirmLabel}
                </AppText>
              </Pressable>
            </View>
          </View>
        </Glass>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.lg,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.modalScrim,
    },
    sheetWrap: {
      maxWidth: 400,
      width: '100%',
      alignSelf: 'center',
    },
    sheetInner: {
      padding: spacing.lg,
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
      paddingHorizontal: spacing.md,
      justifyContent: 'center',
      backgroundColor: colors.orange,
      borderRadius: radius.pill,
    },
    confirmDestructive: { backgroundColor: colors.danger },
    confirmText: { color: colors.onAccent, fontFamily: fonts.semiBold },
    destructiveText: { color: colors.textOnStatus, fontFamily: fonts.semiBold },
  });