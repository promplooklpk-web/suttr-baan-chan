import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors, fonts, radius, spacing } from '@/constants/theme';

export const FLOATING_HEADER_GAP = 8;
export const FLOATING_HEADER_CAPSULE_HEIGHT = 44;
const BELOW_HEADER_SPACING = 12;

export type FloatingHeaderAction = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  active?: boolean;
};

export type FloatingHeaderSegment = {
  id: string;
  label: string;
};

type FloatingHeaderProps = {
  title?: string;
  segments?: FloatingHeaderSegment[];
  activeSegmentId?: string;
  onSegmentPress?: (id: string) => void;
  actions?: FloatingHeaderAction[];
};

export function floatingHeaderClearance(topInset: number): number {
  return topInset + FLOATING_HEADER_GAP + FLOATING_HEADER_CAPSULE_HEIGHT + BELOW_HEADER_SPACING;
}

function GlassCapsule({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[styles.capsuleOuter, style]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 72 : 88}
        tint="light"
        style={styles.capsuleBlur}
      >
        <View style={styles.capsuleInner}>{children}</View>
      </BlurView>
    </View>
  );
}

export function FloatingHeader({
  title,
  segments,
  activeSegmentId,
  onSegmentPress,
  actions = [],
}: FloatingHeaderProps) {
  const insets = useSafeAreaInsets();
  const hasSegments = segments != null && segments.length > 0;

  return (
    <View
      style={[styles.wrapper, { top: insets.top + FLOATING_HEADER_GAP }]}
      pointerEvents="box-none"
    >
      <View style={styles.row} pointerEvents="box-none">
        <GlassCapsule style={styles.leftCapsule}>
          {hasSegments ? (
            <View style={styles.segmentRow}>
              {segments!.map((seg) => {
                const active = seg.id === activeSegmentId;
                return (
                  <Pressable
                    key={seg.id}
                    onPress={() => onSegmentPress?.(seg.id)}
                    style={[styles.segmentPill, active && styles.segmentPillActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <AppText
                      variant="label"
                      style={[styles.segmentText, active && styles.segmentTextActive]}
                      numberOfLines={1}
                    >
                      {seg.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.titlePill}>
              <AppText variant="label" style={styles.titleText} numberOfLines={1}>
                {title ?? ''}
              </AppText>
            </View>
          )}
        </GlassCapsule>

        {actions.length > 0 ? (
          <GlassCapsule style={styles.rightCapsule}>
            <View style={styles.actionsRow}>
              {actions.map((action) => (
                <Pressable
                  key={action.accessibilityLabel}
                  onPress={action.onPress}
                  style={styles.actionBtn}
                  accessibilityLabel={action.accessibilityLabel}
                  hitSlop={4}
                >
                  <Ionicons
                    name={action.icon}
                    size={22}
                    color={action.active ? colors.orange : colors.ink}
                  />
                </Pressable>
              ))}
            </View>
          </GlassCapsule>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  capsuleOuter: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    shadowColor: '#3A2A20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.88)' : undefined,
  },
  capsuleBlur: {
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  capsuleInner: {
    minHeight: FLOATING_HEADER_CAPSULE_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  leftCapsule: {
    flexShrink: 1,
    maxWidth: '58%',
  },
  rightCapsule: {
    flexShrink: 0,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  segmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  segmentPillActive: {
    backgroundColor: colors.ink,
  },
  segmentText: {
    color: colors.ink,
    fontSize: 15,
  },
  segmentTextActive: {
    color: colors.white,
  },
  titlePill: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  titleText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  actionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
});
