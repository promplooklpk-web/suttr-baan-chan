export type ThemeColors = {
  /** Page background */
  cream: string;
  /** Primary card / elevated surface (not necessarily white in dark mode) */
  surface: string;
  /** Secondary surface */
  surface2: string;
  /** Brand accent (green) — use sparingly for primary actions and active states */
  orange: string;
  onAccent: string;
  ink: string;
  inkMuted: string;
  inkLight: string;
  border: string;
  borderStrong: string;
  cardGreen: string;
  cardYellow: string;
  danger: string;
  star: string;
  shadow: string;
  glassBorder: string;
  glassHairline: string;
  glassTint: string;
  glassAndroidBg: string;
  warningBanner: string;
  imagePlaceholder: string;
  cardAccentTints: string[];
  overlayBottom: string;
  overlayTop: string;
  overlayDeep: string;
  textOnStatus: string;
  tabBarFill: string;
  tabBarBorder: string;
  tabBarActivePill: string;
  tabBarShadow: string;
  modalScrim: string;
};

export const lightColors: ThemeColors = {
  cream: '#F7F7F5',
  surface: '#FFFFFF',
  surface2: '#F0F0EE',
  orange: '#15803D',
  onAccent: '#FFFFFF',
  ink: '#1A1C1B',
  inkMuted: '#5C605E',
  inkLight: '#8A8E8C',
  border: '#E6E6E3',
  borderStrong: '#D4D4D0',
  cardGreen: '#16A34A',
  cardYellow: '#A16207',
  danger: '#DC2626',
  star: '#F59E0B',
  shadow: '#1A1C1B',
  glassBorder: 'rgba(255,255,255,0.85)',
  glassHairline: 'rgba(26,28,27,0.08)',
  glassTint: 'rgba(255,255,255,0.62)',
  glassAndroidBg: 'rgba(255,255,255,0.90)',
  warningBanner: '#FEF3C7',
  imagePlaceholder: '#ECECEA',
  cardAccentTints: ['#F0F0EE', '#EFEEEB', '#ECEEED', '#EEEDEF', '#F0EEEC'],
  overlayBottom: 'rgba(14,15,15,0.50)',
  overlayTop: 'rgba(14,15,15,0.18)',
  overlayDeep: 'rgba(14,15,15,0.70)',
  textOnStatus: '#FFFFFF',
  tabBarFill: 'rgba(255,255,255,0.62)',
  tabBarBorder: 'rgba(26,28,27,0.08)',
  tabBarActivePill: 'rgba(26,28,27,0.06)',
  tabBarShadow: 'rgba(26,28,27,0.14)',
  modalScrim: 'rgba(14,15,15,0.35)',
};

export const darkColors: ThemeColors = {
  cream: '#0E0F0F',
  surface: '#171918',
  surface2: '#202221',
  orange: '#22C55E',
  onAccent: '#04210F',
  ink: '#EDEFEE',
  inkMuted: '#9DA19F',
  inkLight: '#727674',
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.16)',
  cardGreen: '#4ADE80',
  cardYellow: '#FBBF24',
  danger: '#F87171',
  star: '#FBBF24',
  shadow: '#000000',
  glassBorder: 'rgba(255,255,255,0.14)',
  glassHairline: 'rgba(255,255,255,0.08)',
  glassTint: 'rgba(23,25,24,0.55)',
  glassAndroidBg: 'rgba(23,25,24,0.92)',
  warningBanner: 'rgba(251,191,36,0.14)',
  imagePlaceholder: '#202221',
  cardAccentTints: ['#1E201F', '#222322', '#1C1F1E', '#212022', '#232120'],
  overlayBottom: 'rgba(14,15,15,0.74)',
  overlayTop: 'rgba(14,15,15,0.36)',
  overlayDeep: 'rgba(14,15,15,0.92)',
  textOnStatus: '#FFFFFF',
  tabBarFill: 'rgba(23,25,24,0.55)',
  tabBarBorder: 'rgba(255,255,255,0.12)',
  tabBarActivePill: 'rgba(255,255,255,0.10)',
  tabBarShadow: 'rgba(0,0,0,0.50)',
  modalScrim: 'rgba(14,15,15,0.60)',
};