import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { accentGlow, surfaceCard } from '@/lib/design';
import { stepForUnit } from '@/lib/fridgeQuantity';
import { formatExpiryLine, fridgeItemStatus, statusPillLabel } from '@/lib/fridgeStatus';
import type { FridgeItem } from '@/types/fridge';

type Props = {
  item: FridgeItem;
  onPress: () => void;
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function SwipeableFridgeRow({ item, onPress, onUse, onEdit, onDelete }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const step = stepForUnit(item.unit);
  const status = fridgeItemStatus(item);
  const statusColor =
    status.kind === 'expired'
      ? colors.danger
      : status.kind === 'expiring'
        ? colors.cardYellow
        : status.kind === 'ok'
          ? colors.cardGreen
          : colors.inkMuted;

  const openActions = () => {
    Alert.alert(item.name, 'เลือกการทำงาน', [
      { text: `ใช้ (ลด ${step} ${item.unit})`, onPress: onUse },
      { text: 'แก้ไข', onPress: onEdit },
      { text: 'ลบ', style: 'destructive', onPress: onDelete },
      { text: 'ยกเลิก', style: 'cancel' },
    ]);
  };

  const expired = status.kind === 'expired';

  return (
    <Pressable
      style={[styles.wrap, expired && accentGlow(colors, true), expired && styles.wrapExpired]}
      onPress={onPress}
      onLongPress={openActions}
    >
      <View style={[styles.accentBar, { backgroundColor: statusColor }]} />
      <View style={[styles.icon, { backgroundColor: `${statusColor}22` }]}>
        <AppText style={[styles.iconLetter, { color: statusColor }]}>
          {item.name.charAt(0)}
        </AppText>
      </View>
      <View style={styles.text}>
        <AppText variant="label" numberOfLines={1}>{item.name}</AppText>
        <AppText variant="caption" muted numberOfLines={1}>
          {formatExpiryLine(item)}
        </AppText>
      </View>
      <View style={styles.rightCol}>
        <AppText variant="caption" muted>
          {item.quantity} {item.unit}
        </AppText>
        <View style={[styles.statusPill, { borderColor: `${statusColor}66` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <AppText variant="caption" style={[styles.statusText, { color: statusColor }]}>
            {statusPillLabel(item)}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapExpired: {
    borderColor: colors.danger,
  },
  wrap: {
    ...surfaceCard(colors),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
    paddingLeft: 0,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
    borderTopLeftRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLetter: { fontFamily: fonts.bold, fontSize: 16 },
  text: { flex: 1, gap: 2, minWidth: 0 },
  rightCol: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: colors.surface2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: fonts.medium,
  },
});
