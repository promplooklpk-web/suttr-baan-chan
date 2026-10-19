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

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { CookTimerProvider } from '@/context/CookTimerContext';
import { FridgeProvider } from '@/context/FridgeContext';
import { MealPlanProvider } from '@/context/MealPlanContext';
import { RecipesProvider } from '@/context/RecipesContext';
import { SnackbarProvider } from '@/context/SnackbarContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { configureExpiryNotifications } from '@/lib/expiryNotifications';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { colors, statusBarStyle } = useTheme();

  return (
    <>
      <StatusBar style={statusBarStyle} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: 'Sarabun_600SemiBold' },
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="recipe/[id]" options={{ headerShown: false }} />
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
    </>
  );
}

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
      configureExpiryNotifications().catch(() => undefined);
    }
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    let sub: { remove: () => void } | undefined;
    void import('expo-notifications')
      .then((Notifications) => {
        sub = Notifications.addNotificationResponseReceivedListener((response) => {
          const screen = response.notification.request.content.data?.screen;
          if (screen === 'fridge-expiring') {
            router.push('/(tabs)/fridge?expiring=1');
          }
        });
      })
      .catch(() => undefined);
    return () => sub?.remove();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SnackbarProvider>
            <CookTimerProvider>
              <RecipesProvider>
                <FridgeProvider>
                  <MealPlanProvider>
                    <RootStack />
                  </MealPlanProvider>
                </FridgeProvider>
              </RecipesProvider>
            </CookTimerProvider>
          </SnackbarProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
