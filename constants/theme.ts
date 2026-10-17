export const colors = {
  orange: '#FF7A3D',
  cream: '#FFF7EC',
  ink: '#3A2A20',
  inkMuted: '#6B5A4E',
  inkLight: '#9A8A7E',
  white: '#FFFFFF',
  cardGreen: '#5BA85B',
  cardYellow: '#FFB400',
  border: '#E8DDD0',
  danger: '#D64545',
  star: '#FFB400',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const fonts = {
  regular: 'Sarabun_400Regular',
  medium: 'Sarabun_500Medium',
  semiBold: 'Sarabun_600SemiBold',
  bold: 'Sarabun_700Bold',
};

export const CATEGORIES = [
  'ทั้งหมด',
  'จานเดียว',
  'ต้ม/แกง',
  'ผัด/ทอด',
  'ขนม',
  'เครื่องดื่ม',
] as const;

export const CATEGORY_VALUES = [
  'อาหารจานเดียว',
  'ต้ม/แกง',
  'ผัด/ทอด',
  'ขนม',
  'เครื่องดื่ม',
] as const;

export type CategoryValue = (typeof CATEGORY_VALUES)[number];
