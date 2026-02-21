import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

export const setupPushNotifications = () => {
    // Handle background and quit state messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('Message handled in the background!', remoteMessage);
    });

    // Handle foreground messages
    const unsubscribe = messaging().onMessage(async remoteMessage => {
        console.log('A new FCM message arrived!', remoteMessage);

        // Optional: show a simple alert for foreground testing
        if (remoteMessage.notification) {
            Alert.alert(
                remoteMessage.notification.title || 'New Notification',
                remoteMessage.notification.body || ''
            );
        }
    });

    return unsubscribe;
};
