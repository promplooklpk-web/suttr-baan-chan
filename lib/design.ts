import type { ViewStyle } from 'react-native';

import type { ThemeColors } from '@/constants/colorSchemes';
import { radius } from '@/constants/theme';

/** Primary card corner radius from dark design board */
export const CARD_RADIUS = radius.xl;

export function surfaceCard(colors: ThemeColors): ViewStyle {
  return {
    backgroundColor: colors.white,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: colors.border,
  };
}

export function surfaceCardElevated(colors: ThemeColors): ViewStyle {
  return {
    ...surfaceCard(colors),
    backgroundColor: colors.surface2,
  };
}

export function accentGlow(colors: ThemeColors, strong = false): ViewStyle {
  return {
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: strong ? 10 : 6 },
    shadowOpacity: strong ? 0.55 : 0.38,
    shadowRadius: strong ? 22 : 14,
    elevation: strong ? 10 : 6,
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
