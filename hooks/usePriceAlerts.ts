import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { subscribeToRateChanges } from '../lib/exchangeRate';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null; // simuladores não recebem push de verdade

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#2563EB',
    });
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    return token;
  } catch {
    return null;
  }
}

// Registra o device para push (Cloud Function `checkExchangeRate` dispara o push quando o
// app está fechado) e mantém um polling local que avisa em tempo real enquanto o app está aberto.
// Ao tocar na notificação, abre direto a tela de Cotação e Reajuste.
export function usePriceAlerts() {
  const registered = useRef(false);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid || registered.current) return;
    registered.current = true;

    registerForPushNotifications().then((token) => {
      if (token) {
        setDoc(doc(db, 'push_tokens', uid), { token, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
      }
    });

    const unsubRate = subscribeToRateChanges(uid, (event) => {
      const direction = event.changePercent > 0 ? 'subiu' : 'desceu';
      Notifications.scheduleNotificationAsync({
        content: {
          title: '💵 Cotação do dólar mudou!',
          body: `Dólar ${direction} ${Math.abs(event.changePercent).toFixed(1)}%! Toque para reajustar seus preços.`,
          data: { screen: 'exchange' },
        },
        trigger: null,
      });
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const screen = response.notification.request.content.data?.screen;
      if (screen === 'exchange') router.push('/(tabs)/exchange');
    });

    return () => {
      unsubRate();
      responseSub.remove();
    };
  }, [uid]);
}
