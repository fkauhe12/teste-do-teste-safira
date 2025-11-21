import { firestoreDb, auth } from './firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Platform, ToastAndroid, Alert } from 'react-native';
import Constants from 'expo-constants';

let unsub = null;
let expoNotifications = null;

export async function initLocalNotifications() {
  const user = auth.currentUser;
  if (!user || !firestoreDb) return null;

  try {
    expoNotifications = await import('expo-notifications');
  } catch (e) {
    console.warn('expo-notifications not available. Install it with `expo install expo-notifications` to enable device alerts.');
    return null;
  }

  // Detect if running inside Expo Go — many `expo-notifications` features
  // (remote push, background handlers) are restricted there since SDK 53.
  try {
    const appOwnership = Constants?.appOwnership || null;
    if (appOwnership === 'expo') {
      console.warn('expo-notifications: running inside Expo Go; remote push and some notification features are limited. Use a development build (EAS dev client) or a standalone build for full functionality. Falling back to in-app alerts.');
    }
  } catch (cErr) {
    // Non-fatal — continue and allow runtime detection to handle missing APIs
  }

  try {
    const notif = expoNotifications.default || expoNotifications;

    // Request permission (try several available names for compatibility)
    try {
      // Try multiple permission APIs and capture result for clearer warnings
      let permResult = null;
      if (typeof notif.requestPermissionsAsync === 'function') {
        permResult = await notif.requestPermissionsAsync();
      } else if (typeof notif.requestPermissions === 'function') {
        permResult = await notif.requestPermissions();
      } else if (typeof notif.getPermissionsAsync === 'function') {
        permResult = await notif.getPermissionsAsync();
        console.warn('expo-notifications: request API not found; used getPermissionsAsync as fallback (may not prompt the user)');
      } else {
        console.warn('expo-notifications: no permission API found on module');
      }

      // Normalise permission result checks
      const granted = !!(permResult && (permResult.status === 'granted' || permResult.granted === true));
      if (!granted) {
        console.warn('notif listen Missing or insufficient permissions. Notifications may not be shown on this device.');
      }
    } catch (permErr) {
      console.warn('requesting notification permissions failed', permErr?.message || permErr);
    }

    // Ensure notifications show in foreground (if available)
    if (typeof notif.setNotificationHandler === 'function') {
      notif.setNotificationHandler({
        handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true }),
      });
    }

    // Which function to use to present notifications immediately?
    const presentFn = typeof notif.presentNotificationAsync === 'function'
      ? notif.presentNotificationAsync
      : typeof notif.scheduleNotificationAsync === 'function'
        ? notif.scheduleNotificationAsync
        : null;

    if (!presentFn) console.warn('expo-notifications: no present/schedule function found; device notifications will not be shown — falling back to in-app alerts');

    // Listen for new documents in `notifications` for this user and present local alert
    const q = query(collection(firestoreDb, 'notifications'), where('userId', '==', user.uid));
    unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const n = change.doc?.data ? change.doc.data() : null;
          if (!n) return;
          try {
            const payload = { title: n.title || 'Nova notificação', body: n.body || '' };
            if (presentFn) {
              // scheduleNotificationAsync expects { content, trigger }
              if (presentFn === notif.scheduleNotificationAsync) {
                await presentFn({ content: payload, trigger: null });
              } else {
                // presentNotificationAsync typically accepts the content directly
                await presentFn(payload);
              }
            } else {
              // Fallback: show a simple in-app notification using Toast (Android) or Alert (iOS)
              try {
                if (Platform.OS === 'android' && ToastAndroid && typeof ToastAndroid.show === 'function') {
                  ToastAndroid.show(payload.title + '\n' + payload.body, ToastAndroid.LONG);
                } else {
                  Alert.alert(payload.title, payload.body);
                }
              } catch (fallbackErr) {
                console.warn('fallback notification failed', fallbackErr?.message || fallbackErr);
              }
            }
          } catch (err) {
            console.warn('failed to present local notification', err?.message || err);
          }
        }
      });
    }, (err) => console.warn('notifications listener error', err?.message));

    return () => {
      if (unsub) unsub();
    };
  } catch (e) {
    console.warn('initLocalNotifications failed', e?.message || e);
    return null;
  }
}

export function cleanupLocalNotifications() {
  if (unsub) unsub();
  unsub = null;
}
