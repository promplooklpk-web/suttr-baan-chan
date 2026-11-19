import type { ViewStyle } from 'react-native';

import type { ThemeColors } from '@/constants/colorSchemes';
import type { ResolvedColorScheme } from '@/context/ThemeContext';
import { radius } from '@/constants/theme';

/** Primary card corner radius */
export const CARD_RADIUS = radius.card;

export type DesignTokens = {
  /** Brand accent colour (same as `colors.orange`) for links and active labels */
  accentText: string;
  /** Neutral soft fill for inline edit rows etc. */
  accentSoft: string;
  info: string;
};

export function getDesignTokens(scheme: ResolvedColorScheme, colors: ThemeColors): DesignTokens {
  return {
    accentText: colors.orange,
    accentSoft: scheme === 'dark' ? 'rgba(255,255,255,0.06)' : colors.surface2,
    info: scheme === 'dark' ? '#38BDF8' : '#0369A1',
  };
}

export function surfaceCard(colors: ThemeColors, isDark = false): ViewStyle {
  return {
    backgroundColor: colors.surface,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: colors.border,
    ...(isDark
      ? {}
      : {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.07,
          shadowRadius: 14,
          elevation: 3,
        }),
  };
}

export function surfaceCardElevated(colors: ThemeColors, isDark = false): ViewStyle {
  return {
    ...surfaceCard(colors, isDark),
    backgroundColor: colors.surface2,
  };
}

/** Glow for primary FAB / buttons only */
export function accentGlow(colors: ThemeColors, strong = false): ViewStyle {
  return {
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: strong ? 8 : 4 },
    shadowOpacity: strong ? 0.35 : 0.22,
    shadowRadius: strong ? 16 : 10,
    elevation: strong ? 8 : 4,
  };
}

export function matchProgressGlow(color: string): ViewStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 6,
    elevation: 2,
  };
}