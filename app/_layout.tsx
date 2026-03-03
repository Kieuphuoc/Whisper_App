import "../global.css";
import { MyDispatchContext, MyUserContext, userReducer } from "@/configs/Context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useReducer, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [user, dispatch] = useReducer(userReducer, null);
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

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
    if (!isReady) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && (inAuthGroup || !segments[0])) {
      router.replace("/home");
    }
  }, [user, segments, isReady]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <MyUserContext.Provider value={user}>
      <MyDispatchContext.Provider value={dispatch}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
        </Stack>
      </MyDispatchContext.Provider>
    </MyUserContext.Provider>
  );
}
