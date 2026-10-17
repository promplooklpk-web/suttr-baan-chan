import {
  Sarabun_400Regular,
  Sarabun_500Medium,
  Sarabun_600SemiBold,
  Sarabun_700Bold,
} from '@expo-google-fonts/sarabun';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { FridgeProvider } from '@/context/FridgeContext';
import { MealPlanProvider } from '@/context/MealPlanContext';
import { RecipesProvider } from '@/context/RecipesContext';
import { colors } from '@/constants/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Sarabun_400Regular,
    Sarabun_500Medium,
    Sarabun_600SemiBold,
    Sarabun_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <RecipesProvider>
      <FridgeProvider>
      <MealPlanProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: 'Sarabun_600SemiBold' },
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="recipe/[id]"
          options={{ title: 'รายละเอียดสูตร', headerBackTitle: 'กลับ' }}
        />
        <Stack.Screen
          name="recipe/edit"
          options={{ title: 'เพิ่มสูตร', presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen name="export/select" options={{ title: 'ส่งออกสูตร' }} />
        <Stack.Screen name="import/preview" options={{ title: 'นำเข้าสูตร' }} />
        <Stack.Screen
          name="recipe/cook/[id]"
          options={{ title: 'โหมดทำอาหาร', headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="tags/index" options={{ title: 'จัดการแท็ก' }} />
        <Stack.Screen name="about" options={{ title: 'เกี่ยวกับแอป' }} />
        <Stack.Screen name="fridge/[id]" options={{ title: 'รายละเอียด' }} />
        <Stack.Screen name="fridge/match/[recipeId]" options={{ title: 'เช็คของในตู้' }} />
      </Stack>
      </MealPlanProvider>
      </FridgeProvider>
    </RecipesProvider>
    </GestureHandlerRootView>
  );
}
