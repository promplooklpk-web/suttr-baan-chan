import { useColorScheme as useSystemColorScheme } from 'react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { darkColors, lightColors, type ThemeColors } from '@/constants/colorSchemes';
import {
  loadThemePreference,
  saveThemePreference,
  type ThemePreference,
} from '@/lib/themeStorage';

export type ResolvedColorScheme = 'light' | 'dark';

type ThemeContextValue = {
  colors: ThemeColors;
  colorScheme: ResolvedColorScheme;
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
  isDark: boolean;
  blurTint: 'light' | 'dark';
  statusBarStyle: 'light' | 'dark' | 'auto';
  keyboardAppearance: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveScheme(preference: ThemePreference, system: string | null | undefined): ResolvedColorScheme {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return system === 'dark' ? 'dark' : 'light';
}

type ThemeProviderProps = {
  children: ReactNode;
  /** Test override — skips async load and fixes scheme */
  initialPreference?: ThemePreference;
  forcedColorScheme?: ResolvedColorScheme;
};

export function ThemeProvider({
  children,
  initialPreference = 'dark',
  forcedColorScheme,
}: ThemeProviderProps) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference);
  useEffect(() => {
    if (forcedColorScheme != null) return;
    let cancelled = false;
    loadThemePreference().then((p) => {
      if (!cancelled) {
        setPreferenceState(p);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [forcedColorScheme]);

  const colorScheme =
    forcedColorScheme ?? resolveScheme(preference, systemScheme);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    if (forcedColorScheme == null) {
      saveThemePreference(next).catch(() => undefined);
    }
  }, [forcedColorScheme]);

  const value = useMemo((): ThemeContextValue => {
    const colors = colorScheme === 'dark' ? darkColors : lightColors;
    const isDark = colorScheme === 'dark';
    return {
      colors,
      colorScheme,
      preference,
      setPreference,
      isDark,
      blurTint: isDark ? 'dark' : 'light',
      statusBarStyle: isDark ? 'light' : 'dark',
      keyboardAppearance: isDark ? 'dark' : 'light',
    };
  }, [colorScheme, preference, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
