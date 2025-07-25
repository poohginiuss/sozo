import { AuthProvider } from './context/AuthContext';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StreamProvider } from './context/StreamContext';  // Make sure this path is correct

// LogBox.ignoreAllLogs(); // Commented out for production - enable during development only

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  const [loaded] = useFonts({
    Montserrat_Light: require("../assets/fonts/Montserrat-Light.ttf"),
    Montserrat_Regular: require("../assets/fonts/Montserrat-Regular.ttf"),
    Montserrat_Medium: require("../assets/fonts/Montserrat-Medium.ttf"),
    Montserrat_SemiBold: require("../assets/fonts/Montserrat-SemiBold.ttf"),
    Montserrat_Bold: require("../assets/fonts/Montserrat-Bold.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
    const subscription = AppState.addEventListener("change", (_) => {
      StatusBar.setBarStyle("light-content");
    });
    return () => {
      subscription.remove();
    };
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StreamProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth/signinScreen" options={{ gestureEnabled: false }} />
            <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="nowPlaying/nowPlayingScreen" />
            <Stack.Screen name="article/articleScreen" />
          </Stack>
        </StreamProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
