import { useEffect, useState, useRef } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { usePriceAlerts } from '../hooks/usePriceAlerts';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS,
} from 'react-native-reanimated';

function useProtectedRoute(user: User | null, hasMarket: boolean, authLoading: boolean) {
  const segments = useSegments();

  useEffect(() => {
    if (authLoading) return;

    const segs = segments as string[];
    const inAuth = segs[0] === '(auth)';
    const inOnboarding = segs[1] === 'onboarding';

    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && !hasMarket && !inOnboarding) {
      router.replace('/(auth)/onboarding');
    } else if (user && hasMarket && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, hasMarket, authLoading, segments]);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [user, setUser] = useState<User | null>(null);
  const [hasMarket, setHasMarket] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [minTimeDone, setMinTimeDone] = useState(false);

  // Splash animations
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const splashOverlayOpacity = useSharedValue(1);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const splashStyle = useAnimatedStyle(() => ({
    opacity: splashOverlayOpacity.value,
  }));

  // Start logo animation immediately
  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSpring(1.0, { damping: 12, stiffness: 100 });
    const timer = setTimeout(() => setMinTimeDone(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Hide splash when both loading done and min time elapsed
  const hidingSplash = useRef(false);
  useEffect(() => {
    const isReady = fontsLoaded && !authLoading && minTimeDone;
    if (isReady && showSplash && !hidingSplash.current) {
      hidingSplash.current = true;
      splashOverlayOpacity.value = withTiming(0, { duration: 400 }, (done) => {
        if (done) runOnJS(setShowSplash)(false);
      });
    }
  }, [fontsLoaded, authLoading, minTimeDone]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setHasMarket(false);
        setAuthLoading(false);
        return;
      }
      const unsubMarket = onSnapshot(doc(db, 'markets', firebaseUser.uid), (snap) => {
        setHasMarket(snap.exists());
        setAuthLoading(false);
      });
      return unsubMarket;
    });
    return unsubAuth;
  }, []);

  useProtectedRoute(user, hasMarket, authLoading);
  usePriceAlerts();

  const stackContent = (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="create/index" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="editor/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="product/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="campaign/new" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="campaign/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="legal/terms" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="legal/privacy" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="upgrade" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );

  const splashScreen = showSplash ? (
    <Animated.View style={[StyleSheet.absoluteFill, styles.splashOverlay, splashStyle]}>
      <LinearGradient colors={['#1D4ED8', '#7C3AED']} style={styles.splashGradient}>
        <Animated.View style={[styles.splashLogoWrap, logoStyle]}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.splashLogo}
            resizeMode="contain"
          />
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  ) : null;

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1 }}>
        {stackContent}
        {splashScreen}
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {stackContent}
      {splashScreen}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    zIndex: 999,
  },
  splashGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 120,
    height: 120,
    borderRadius: 28,
  },
});
