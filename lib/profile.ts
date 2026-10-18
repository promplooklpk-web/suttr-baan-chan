export const PROFILE_DISPLAY_NAME = 'ยันยง P.';

export function profileAvatarInitial(name: string = PROFILE_DISPLAY_NAME): string {
  const trimmed = name.trim();
  if (!trimmed) return 'ย';
  return trimmed.charAt(0);
}
