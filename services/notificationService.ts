import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { endpoints, authApis } from '../configs/Apis';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(userToken: string) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Get the FCM token
    token = (await Notifications.getDevicePushTokenAsync()).data;
    console.log('FCM Token:', token);

    // Send token to backend
    try {
      await authApis(userToken).put(endpoints.updateFcmToken, { fcmToken: token });
      console.log('FCM Token synced with backend');
    } catch (error) {
      console.error('Error syncing FCM token:', error);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export function addNotificationListener(callback: (notification: Notifications.Notification) => void) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
