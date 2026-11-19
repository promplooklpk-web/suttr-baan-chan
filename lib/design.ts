import type { ViewStyle } from 'react-native';

import type { ThemeColors } from '@/constants/colorSchemes';
import type { ResolvedColorScheme } from '@/context/ThemeContext';
import { radius } from '@/constants/theme';

/** Primary card corner radius */
export const CARD_RADIUS = radius.card;

export type DesignTokens = {
  /** Brand accent colour (same as `colors.orange`) for links and active labels */
  accentText: string;
  /** Neutral soft fill (surface2) for inline rows — not a green tint */
  accentSoft: string;
  sheetFill: string;
  glassHighlight: string;
  segmentActive: string;
  info: string;
};

export function getDesignTokens(scheme: ResolvedColorScheme, colors: ThemeColors): DesignTokens {
  const isDark = scheme === 'dark';
  return {
    accentText: colors.orange,
    accentSoft: colors.surface2,
    sheetFill: isDark ? 'rgba(23,25,24,0.80)' : 'rgba(255,255,255,0.78)',
    glassHighlight: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.95)',
    segmentActive: isDark ? '#2A2D2B' : '#FFFFFF',
    info: isDark ? '#38BDF8' : '#0369A1',
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
export function accentGlow(colors: ThemeColors, strong = false, isDark = false): ViewStyle {
  return {
    shadowColor: isDark ? '#000000' : colors.orange,
    shadowOffset: { width: 0, height: strong ? 8 : 6 },
    shadowOpacity: isDark ? (strong ? 0.5 : 0.4) : strong ? 0.28 : 0.22,
    shadowRadius: strong ? 14 : 10,
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