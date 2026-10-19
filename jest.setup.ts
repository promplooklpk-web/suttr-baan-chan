jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/mock/documents/',
  getInfoAsync: jest.fn(async () => ({ exists: false })),
  readAsStringAsync: jest.fn(async () => '{}'),
  writeAsStringAsync: jest.fn(async () => undefined),
  makeDirectoryAsync: jest.fn(async () => undefined),
  copyAsync: jest.fn(async () => undefined),
  deleteAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: () => 'test-uuid',
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

jest.mock('@/lib/storage', () => {
  const actual = jest.requireActual('@/lib/storage');
  const { seedRecipe, seedRecipeTwo } = require('./__tests__/fixtures/seed');
  const recipes = [seedRecipe, seedRecipeTwo];
  return {
    ...actual,
    initializeStorage: jest.fn(async () => recipes),
    loadRecipes: jest.fn(async () => recipes),
    saveRecipes: jest.fn(async (next: unknown) => next),
    photoUri: jest.fn(() => undefined),
  };
});

jest.mock('@/lib/fridgeStorage', () => {
  const actual = jest.requireActual('@/lib/fridgeStorage');
  const { seedFridgeItems } = require('./__tests__/fixtures/seed');
  return {
    ...actual,
    loadFridgeStore: jest.fn(async () => ({
      items: seedFridgeItems,
      updatedAt: new Date().toISOString(),
    })),
  };
});

jest.mock('@/lib/mealPlanStorage', () => {
  const actual = jest.requireActual('@/lib/mealPlanStorage');
  return {
    ...actual,
    loadMealPlan: jest.fn(async () => {
      const days = actual.buildWeekDays();
      return { weekStart: days[0].date, days };
    }),
  };
});

jest.mock('@/lib/shoppingList', () => {
  const actual = jest.requireActual('@/lib/shoppingList');
  return {
    ...actual,
    loadShoppingList: jest.fn(async () => ({ items: [], updatedAt: new Date().toISOString() })),
  };
});

jest.mock('@/lib/themeStorage', () => ({
  loadThemePreference: jest.fn(async () => 'dark' as const),
  saveThemePreference: jest.fn(async () => undefined),
}));

jest.mock('@/lib/pickerHistory', () => {
  const actual = jest.requireActual('@/lib/pickerHistory');
  return {
    ...actual,
    loadPickerHistory: jest.fn(async () => ({})),
  };
});

jest.mock('expo-router', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  function Link({ asChild, children, href, style, ...rest }) {
    if (asChild && React.isValidElement(children)) {
      const child = children;
      if (Array.isArray(child.props.style)) {
        throw new Error(
          '[expo-router]: You are passing an array of styles to a child of <Slot>. Consider flattening the styles with StyleSheet.flatten before passing them to the child component.',
        );
      }
      const merged = [child.props.style, style].filter(Boolean);
      return React.cloneElement(child, {
        ...rest,
        style: merged.length > 1 ? merged : merged[0],
      });
    }
    return React.createElement(Pressable, rest, React.createElement(Text, null, String(href)));
  }

  function Stack({ children }) {
    return children;
  }
  Stack.Screen = () => null;

  return {
    Link,
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    useLocalSearchParams: jest.fn(() => ({})),
    Stack,
    Redirect: () => null,
  };
});
