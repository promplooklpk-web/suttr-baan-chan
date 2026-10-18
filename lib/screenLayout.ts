import { spacing } from '@/constants/theme';

/** Extra scroll padding so content clears the floating glass tab bar + FAB */
export const TAB_BAR_SCROLL_PADDING = 120;

export function scrollPaddingBottom(bottomInset: number): number {
  return bottomInset + TAB_BAR_SCROLL_PADDING;
}

/** Top padding for tab screens without a floating header capsule */
export function screenTopPadding(topInset: number): number {
  return topInset + spacing.md;
}
