import "../global.css";
import { MyDispatchContext, MyUserContext, userReducer } from "@/configs/Context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useReducer, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
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
      // Apply global font once loaded
      setCustomText({
        style: {
          fontFamily: 'Quicksand_400Regular',
        }
      });
      setCustomTextInput({
        style: {
          fontFamily: 'Quicksand_400Regular',
        }
      });
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
    <MyUserContext.Provider value={user}>
      <MyDispatchContext.Provider value={dispatch}>
        <RootLayoutNav user={user} />
      </MyDispatchContext.Provider>
    </MyUserContext.Provider>
  );
}

function RootLayoutNav({ user }: { user: any }) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && (inAuthGroup || !segments[0])) {
      router.replace("/home");
    }
  }, [user, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
    </Stack>
  );
}
