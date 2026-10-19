import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { emitFeedback, setFeedbackListener, type FeedbackPayload } from '@/lib/feedbackBus';
import { TAB_BAR_SCROLL_PADDING } from '@/lib/screenLayout';

type SnackbarContextValue = {
  showSnackbar: (message: string, onUndo?: () => void | Promise<void>) => void;
  showErrorSnackbar: (message: string) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

const UNDO_MS = 5000;

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [payload, setPayload] = useState<FeedbackPayload | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() =>
      setPayload(null),
    );
  }, [opacity]);

  const present = useCallback(
    (next: FeedbackPayload) => {
      if (timer.current) clearTimeout(timer.current);
      setPayload(next);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(hide, UNDO_MS);
    },
    [hide, opacity],
  );

  const showSnackbar = useCallback(
    (message: string, onUndo?: () => void | Promise<void>) => {
      present({ message, variant: 'default', onUndo });
    },
    [present],
  );

  const showErrorSnackbar = useCallback(
    (message: string) => {
      present({ message, variant: 'error' });
    },
    [present],
  );

  useEffect(() => {
    setFeedbackListener((p) => present(p));
    return () => setFeedbackListener(null);
  }, [present]);

  const value = useMemo(
    () => ({ showSnackbar, showErrorSnackbar }),
    [showSnackbar, showErrorSnackbar],
  );

  const isError = payload?.variant === 'error';

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {payload && (
        <Animated.View
          style={[
            styles.wrap,
            { bottom: insets.bottom + TAB_BAR_SCROLL_PADDING - spacing.lg, opacity },
          ]}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.bar,
              isError && { borderColor: colors.danger, backgroundColor: colors.surface },
            ]}
          >
            <AppText
              variant="label"
              style={[styles.msg, isError && { color: colors.danger }]}
              numberOfLines={3}
            >
              {payload.message}
            </AppText>
            {payload.onUndo ? (
              <Pressable
                onPress={async () => {
                  hide();
                  await payload.onUndo?.();
                }}
                hitSlop={12}
                style={styles.undoBtn}
              >
                <AppText variant="label" style={styles.undoText}>เลิกทำ</AppText>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar requires SnackbarProvider');
  return ctx;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      zIndex: 100,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface2,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      shadowColor: colors.shadow,
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    msg: { flex: 1, color: colors.ink },
    undoBtn: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
    },
    undoText: { color: colors.orange, fontFamily: fonts.semiBold },
  });

export { emitFeedback };
