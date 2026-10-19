import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CookTimerProvider } from '@/context/CookTimerContext';
import { FridgeProvider } from '@/context/FridgeContext';
import { MealPlanProvider } from '@/context/MealPlanContext';
import { RecipesProvider } from '@/context/RecipesContext';
import { SnackbarProvider } from '@/context/SnackbarContext';
import { ThemeProvider } from '@/context/ThemeContext';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

type ProviderOptions = {
  colorScheme?: 'light' | 'dark';
};

function AllProviders({
  children,
  colorScheme,
}: {
  children: ReactNode;
  colorScheme?: 'light' | 'dark';
}) {
  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider forcedColorScheme={colorScheme}>
        <SnackbarProvider>
          <CookTimerProvider>
            <RecipesProvider>
              <FridgeProvider>
                <MealPlanProvider>{children}</MealPlanProvider>
              </FridgeProvider>
            </RecipesProvider>
          </CookTimerProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & ProviderOptions,
) {
  const { colorScheme, ...renderOptions } = options ?? {};
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AllProviders colorScheme={colorScheme}>{children}</AllProviders>
  );
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
