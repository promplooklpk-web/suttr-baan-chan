export type ThemeColors = {
  /** Page background */
  cream: string;
  /** Primary card / elevated surface */
  white: string;
  /** Secondary surface */
  surface2: string;
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
};

export const lightColors: ThemeColors = {
  cream: '#FFF7EC',
  white: '#FFFFFF',
  surface2: '#FFF3E6',
  orange: '#FF7A3D',
  onAccent: '#FFFFFF',
  ink: '#3A2A20',
  inkMuted: '#6B5A4E',
  inkLight: '#9A8A7E',
  border: '#E8DDD0',
  borderStrong: '#D9CEC2',
  cardGreen: '#5BA85B',
  cardYellow: '#FFB400',
  danger: '#D64545',
  star: '#FFB400',
  shadow: '#3A2A20',
  glassBorder: 'rgba(255,255,255,0.9)',
  glassHairline: 'rgba(58,42,32,0.08)',
  glassTint: 'rgba(255,255,255,0.42)',
  glassAndroidBg: 'rgba(255,255,255,0.82)',
  warningBanner: '#FFF3CD',
  imagePlaceholder: '#FFE8D6',
  cardAccentTints: ['#E8F5E9', '#FFF3CD', '#FFE8D6', '#E3F2FD', '#F3E5F5'],
  overlayBottom: 'rgba(58,42,32,0.45)',
  overlayTop: 'rgba(58,42,32,0.2)',
  overlayDeep: 'rgba(58,42,32,0.65)',
  textOnStatus: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  cream: '#0E0D0C',
  white: '#17140F',
  surface2: '#211C16',
  orange: '#F08040',
  onAccent: '#1A0F08',
  ink: '#F6EFE8',
  inkMuted: '#A0958A',
  inkLight: '#7A7168',
  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.16)',
  cardGreen: '#5FD38D',
  cardYellow: '#FFB547',
  danger: '#FF6B6B',
  star: '#FFB547',
  shadow: '#F08040',
  glassBorder: 'rgba(255,255,255,0.14)',
  glassHairline: 'rgba(255,255,255,0.09)',
  glassTint: 'rgba(23,20,15,0.55)',
  glassAndroidBg: 'rgba(23,20,15,0.92)',
  warningBanner: 'rgba(255,181,71,0.18)',
  imagePlaceholder: '#211C16',
  cardAccentTints: ['#1A2A1E', '#2A2418', '#2A1E14', '#1A2228', '#241A28'],
  overlayBottom: 'rgba(14,13,12,0.72)',
  overlayTop: 'rgba(14,13,12,0.38)',
  overlayDeep: 'rgba(14,13,12,0.92)',
  textOnStatus: '#FFFFFF',
};
