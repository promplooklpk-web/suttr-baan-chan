import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { stepForUnit } from '@/lib/fridgeQuantity';
import { formatExpiryLine, fridgeItemStatus } from '@/lib/fridgeStatus';
import type { FridgeItem } from '@/types/fridge';

type Props = {
  item: FridgeItem;
  onPress: () => void;
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

/** Expo Go–safe row actions (no RNGH swipe — avoids native module mismatch). */
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

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.row} onPress={onPress} onLongPress={openActions}>
        <View style={[styles.icon, { backgroundColor: `${statusColor}22` }]}>
          <AppText style={[styles.iconLetter, { color: statusColor }]}>
            {item.name.charAt(0)}
          </AppText>
        </View>
        <View style={styles.text}>
          <AppText variant="label" numberOfLines={1}>{item.name}</AppText>
          <AppText variant="caption" style={{ color: statusColor }}>
            {formatExpiryLine(item)}
          </AppText>
        </View>
        <AppText variant="caption" muted>
          {item.quantity} {item.unit}
        </AppText>
        <Pressable onPress={openActions} hitSlop={8} style={styles.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.inkMuted} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLetter: { fontFamily: fonts.bold, fontSize: 18 },
  text: { flex: 1, gap: 2 },
  moreBtn: { padding: spacing.xs },
});
