import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { StepperButton } from '@/components/fridge/StepperButton';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import {
  FRIDGE_UNIT_OPTIONS,
  formatQuantityLabel,
  parseQuantityInput,
  quickAmountsForUnit,
  stepForUnit,
} from '@/lib/fridgeQuantity';

type Props = {
  quantity: number;
  unit: string;
  onQuantityChange: (q: number) => void;
  onUnitChange: (unit: string) => void;
  label?: string;
};

export function FridgeQuantityEditor({
  quantity,
  unit,
  onQuantityChange,
  onUnitChange,
  label = 'จำนวน',
}: Props) {
  const [text, setText] = useState(formatQuantityLabel(quantity));
  const [customUnit, setCustomUnit] = useState('');
  const [showCustomUnit, setShowCustomUnit] = useState(
    () => !FRIDGE_UNIT_OPTIONS.includes(unit as (typeof FRIDGE_UNIT_OPTIONS)[number]),
  );
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setText(formatQuantityLabel(quantity));
  }, [quantity]);

  useEffect(() => {
    const isPreset = FRIDGE_UNIT_OPTIONS.includes(unit as (typeof FRIDGE_UNIT_OPTIONS)[number]);
    setShowCustomUnit(!isPreset);
    if (!isPreset) setCustomUnit(unit);
  }, [unit]);

  const applyText = (raw: string) => {
    setText(raw);
    const n = parseQuantityInput(raw);
    if (n != null && n >= 0) onQuantityChange(n);
  };

  const step = stepForUnit(unit);
  const quick = quickAmountsForUnit(unit);

  const bump = (delta: number) => {
    const base = parseQuantityInput(text) ?? quantity;
    const next = Math.max(0, base + delta);
    onQuantityChange(next);
    setText(formatQuantityLabel(next));
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="label">{label}</AppText>

      <View style={styles.mainRow}>
        <StepperButton direction="down" onStep={() => bump(-step)} />
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={applyText}
          onFocus={() => {
            inputRef.current?.setNativeProps({ selection: { start: 0, end: text.length } });
          }}
          selectTextOnFocus
          keyboardType="decimal-pad"
          style={styles.bigInput}
          placeholder="0"
          placeholderTextColor={colors.inkLight}
        />
        <StepperButton direction="up" onStep={() => bump(step)} />
      </View>
      <AppText variant="caption" muted style={styles.stepHint}>
        ปุ่ม +/- ละ {formatQuantityLabel(step)} {unit} (กดค้างเพื่อเพิ่ม/ลดต่อเนื่อง)
      </AppText>

      <AppText variant="caption" muted style={styles.subLabel}>ปริมาณด่วน</AppText>
      <View style={styles.chipRow}>
        {quick.map((q) => (
          <Pressable
            key={q}
            style={styles.chip}
            onPress={() => {
              onQuantityChange(q);
              setText(formatQuantityLabel(q));
            }}
          >
            <AppText variant="caption">{formatQuantityLabel(q)}</AppText>
          </Pressable>
        ))}
      </View>

      <AppText variant="caption" muted style={styles.subLabel}>หน่วย</AppText>
      <View style={styles.chipRow}>
        {FRIDGE_UNIT_OPTIONS.map((u) => (
          <Pressable
            key={u}
            onPress={() => {
              setShowCustomUnit(false);
              onUnitChange(u);
            }}
            style={[styles.chip, unit === u && !showCustomUnit && styles.chipOn]}
          >
            <AppText
              variant="caption"
              style={{ color: unit === u && !showCustomUnit ? colors.white : colors.ink }}
            >
              {u}
            </AppText>
          </Pressable>
        ))}
        <Pressable
          style={[styles.chip, showCustomUnit && styles.chipOn]}
          onPress={() => setShowCustomUnit(true)}
        >
          <AppText variant="caption" style={{ color: showCustomUnit ? colors.white : colors.ink }}>
            กำหนดเอง
          </AppText>
        </Pressable>
      </View>
      {showCustomUnit && (
        <TextInput
          value={customUnit}
          onChangeText={(v) => {
            setCustomUnit(v);
            onUnitChange(v.trim() || unit);
          }}
          placeholder="พิมพ์หน่วยเอง"
          placeholderTextColor={colors.inkLight}
          style={styles.customUnitInput}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.sm },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bigInput: {
    flex: 1,
    minHeight: 56,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.ink,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  stepHint: { marginTop: spacing.xs, textAlign: 'center' },
  subLabel: { marginTop: spacing.md, marginBottom: spacing.xs },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  customUnitInput: {
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
});
