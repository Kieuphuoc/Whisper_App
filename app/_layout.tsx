import "../global.css";
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { MyDispatchContext, MyUserContext, userReducer } from "@/configs/Context";
import { SocketProvider } from "@/configs/SocketContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useReducer, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Text } from "@/components/ui/text";
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Quicksand_300Light,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold
} from '@expo-google-fonts/quicksand';
import { setCustomText, setCustomTextInput } from 'react-native-global-props';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [user, dispatch] = useReducer(userReducer, null);
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Quicksand_300Light,
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userData = await AsyncStorage.getItem("user");

        if (token && userData) {
          dispatch({ type: "SET_USER", payload: JSON.parse(userData) });
        }
      } catch (e) {
        console.error("Failed to load user state", e);
      } finally {
        setIsReady(true);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (isReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isReady, fontsLoaded]);

  if (!isReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <MyUserContext.Provider value={user}>
          <MyDispatchContext.Provider value={dispatch}>
            <SocketProvider>
              <RootLayoutNav user={user} />
            </SocketProvider>
          </MyDispatchContext.Provider>
        </MyUserContext.Provider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav({ user }: { user: any }) {
  const segments = useSegments();
  const router = useRouter();
  const [isOnboardingChecked, setIsOnboardingChecked] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check onboarding status ONCE on mount only, NOT on every segment change.
  // Running this on segment changes caused a race condition: when segments changed
  // (e.g. navigating to /home), isOnboardingChecked briefly reset to false, then
  // back to true — triggering the guard while user context was still null from
  // AsyncStorage, causing an incorrect redirect to /login within 3-4 seconds.
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem("onboarding_completed");
        setHasCompletedOnboarding(completed === "true");
      } catch (e) {
        console.error("Failed to check onboarding status", e);
      } finally {
        setIsOnboardingChecked(true);
      }
    };
    checkOnboarding();
  }, []); // ← Chỉ chạy 1 lần khi mount

  useEffect(() => {
    if (!isOnboardingChecked) return;

    const checkRedirect = async () => {
      const inAuthGroup = segments[0] === "(auth)";
      const inOnboarding = segments[0] === "onboarding";

      // If local state says onboarding not completed, double check AsyncStorage
      // to avoid stale state issues during transitions.
      let currentHasCompletedOnboarding = hasCompletedOnboarding;
      if (!currentHasCompletedOnboarding && !inOnboarding) {
        const completed = await AsyncStorage.getItem("onboarding_completed");
        if (completed === "true") {
          setHasCompletedOnboarding(true);
          currentHasCompletedOnboarding = true;
        }
      }

      if (!currentHasCompletedOnboarding && !inOnboarding) {
        router.replace("/onboarding");
        return;
      }

      if (currentHasCompletedOnboarding) {
        if (!user && !inAuthGroup && !inOnboarding) {
          router.replace("/login");
        } else if (user && (inAuthGroup || inOnboarding || !segments[0])) {
          router.replace("/home");
        }
      }
    };

    checkRedirect();
  }, [user, segments, isOnboardingChecked, hasCompletedOnboarding]);

  if (!isOnboardingChecked) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
    </Stack>
  );
}
