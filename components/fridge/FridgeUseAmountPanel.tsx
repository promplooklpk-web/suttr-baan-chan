import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

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
import type { FridgeItem } from '@/types/fridge';

type Props = {
  item: FridgeItem;
  onSubtract: (amount: number) => Promise<void>;
};

export function FridgeUseAmountPanel({ item, onSubtract }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors, keyboardAppearance } = useTheme();
  const [useText, setUseText] = useState('');

  const applySubtract = async (amount: number) => {
    if (amount <= 0) return;
    if (amount > item.quantity) {
      Alert.alert('มากกว่าที่มี', `มีอยู่ ${formatQuantityLabel(item.quantity)} ${item.unit}`);
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
              Alert.alert('กรุณาใส่จำนวน');
              return;
            }
            await applySubtract(n);
            setUseText('');
          }}
        >
          <AppText style={styles.applyText}>ใช้</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { marginVertical: spacing.lg },
  presetRow: { gap: spacing.sm, marginTop: spacing.sm },
  presetBtn: {
    backgroundColor: colors.white,
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
  useInput: {
    flex: 1,
    backgroundColor: colors.white,
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
  applyText: { color: colors.white, fontFamily: fonts.semiBold },
});
