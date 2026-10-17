import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FridgeProvider } from '@/context/FridgeContext';
import { MealPlanProvider } from '@/context/MealPlanContext';
import { RecipesProvider } from '@/context/RecipesContext';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <RecipesProvider>
        <FridgeProvider>
          <MealPlanProvider>{children}</MealPlanProvider>
        </FridgeProvider>
      </RecipesProvider>
    </SafeAreaProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}
