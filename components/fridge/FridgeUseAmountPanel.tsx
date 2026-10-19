import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  formatQuantityLabel,
  parseQuantityInput,
  usagePresetLabel,
  usageSubtractAmount,
} from '@/lib/fridgeQuantity';
import { emitFeedback } from '@/lib/feedbackBus';
import type { FridgeItem } from '@/types/fridge';

type Props = {
  item: FridgeItem;
  onSubtract: (amount: number) => Promise<void>;
};

export function FridgeUseAmountPanel({ item, onSubtract }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors, keyboardAppearance } = useTheme();
  const [useText, setUseText] = useState('');
  const [useError, setUseError] = useState('');

  const applySubtract = async (amount: number) => {
    if (amount <= 0) return;
    if (amount > item.quantity) {
      emitFeedback(`มีอยู่ ${formatQuantityLabel(item.quantity)} ${item.unit}`, { error: true });
      return;
    }
    await onSubtract(amount);
  };

  const presets: ('half' | 'quarter' | 'all')[] = ['half', 'quarter', 'all'];

  return (
    <View style={styles.wrap}>
      <AppText variant="label">ใช้ไป</AppText>
      <View style={styles.presetRow}>
        {presets.map((p) => (
          <Pressable
            key={p}
            style={styles.presetBtn}
            onPress={() => applySubtract(usageSubtractAmount(item, p))}
          >
            <AppText variant="caption" style={styles.presetText}>
              {usagePresetLabel(item, p)}
            </AppText>
          </Pressable>
        ))}
      </View>
      <View style={styles.customRow}>
        <TextInput
          keyboardAppearance={keyboardAppearance}
          value={useText}
          onChangeText={setUseText}
          keyboardType="decimal-pad"
          placeholder={`จำนวนที่ใช้ (${item.unit})`}
          placeholderTextColor={colors.inkLight}
          style={styles.useInput}
          selectTextOnFocus
        />
        <Pressable
          style={styles.applyBtn}
          onPress={async () => {
            const n = parseQuantityInput(useText);
            if (n == null || n <= 0) {
              setUseError('กรุณาใส่จำนวน');
              return;
            }
            setUseError('');
            await applySubtract(n);
            setUseText('');
          }}
        >
          <AppText style={styles.applyText}>ใช้</AppText>
        </Pressable>
      </View>
      {useError ? <AppText variant="caption" style={styles.useError}>{useError}</AppText> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { marginVertical: spacing.lg },
  presetRow: { gap: spacing.sm, marginTop: spacing.sm },
  presetBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetText: { fontFamily: fonts.medium, textAlign: 'center' },
  customRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  useError: { color: colors.danger, marginTop: spacing.xs },
  useInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  applyBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  applyText: { color: colors.surface, fontFamily: fonts.semiBold },
});
