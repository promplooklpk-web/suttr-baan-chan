import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { AppText } from '@/components/AppText';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { formatExpiryLine, fridgeItemStatus } from '@/lib/fridgeStatus';
import type { FridgeItem } from '@/types/fridge';

type Props = {
  item: FridgeItem;
  onPress: () => void;
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function SwipeableFridgeRow({ item, onPress, onUse, onEdit, onDelete }: Props) {
  const status = fridgeItemStatus(item);
  const statusColor =
    status.kind === 'expired'
      ? colors.danger
      : status.kind === 'expiring'
        ? colors.cardYellow
        : status.kind === 'ok'
          ? colors.cardGreen
          : colors.inkMuted;

  const renderActions = () => (
    <View style={styles.actions}>
      <Pressable style={[styles.actionBtn, styles.useBtn]} onPress={onUse}>
        <AppText style={styles.actionText}>ใช้</AppText>
      </Pressable>
      <Pressable style={[styles.actionBtn, styles.editBtn]} onPress={onEdit}>
        <AppText style={styles.actionTextDark}>แก้ไข</AppText>
      </Pressable>
      <Pressable style={[styles.actionBtn, styles.delBtn]} onPress={onDelete}>
        <AppText style={styles.actionText}>ลบ</AppText>
      </Pressable>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderActions} overshootRight={false}>
      <Pressable style={styles.row} onPress={onPress}>
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
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
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
  actions: { flexDirection: 'row' },
  actionBtn: {
    width: 72,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  useBtn: { backgroundColor: colors.cardGreen },
  editBtn: { backgroundColor: colors.cardYellow },
  delBtn: { backgroundColor: colors.danger },
  actionText: { color: colors.white, fontFamily: fonts.semiBold, fontSize: 13 },
  actionTextDark: { color: colors.ink, fontFamily: fonts.semiBold, fontSize: 13 },
});
