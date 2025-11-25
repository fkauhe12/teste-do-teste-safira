import { firestoreDb, auth } from './firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Platform, ToastAndroid, Alert } from 'react-native';

let unsub = null;

// Simple notification service compatible with Expo Go.
// - Does NOT use `expo-notifications` and therefore does not request
//   notification permissions or log dev-client warnings.
// - Listens to Firestore `notifications` collection for documents with
//   `userId` equal to the current user and shows a simple local alert
//   (Toast on Android, Alert on other platforms).
export async function initLocalNotifications() {
  const user = auth?.currentUser;
  if (!user || !firestoreDb) return null;

  try {
    const q = query(collection(firestoreDb, 'notifications'), where('userId', '==', user.uid));
    unsub = onSnapshot(q, (snap) => {
      try {
        snap.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const n = change.doc?.data ? change.doc.data() : null;
            if (!n) return;
            const title = n.title || 'Nova notificação';
            const body = n.body || '';
            try {
              if (Platform.OS === 'android' && ToastAndroid && typeof ToastAndroid.show === 'function') {
                ToastAndroid.show(`${title}\n${body}`, ToastAndroid.LONG);
              } else {
                Alert.alert(title, body);
              }
            } catch (showErr) {
              // don't spam logs; ignore UI failures silently
            }
          }
        });
      } catch (innerErr) {
        // ignore per-user snapshot processing errors
      }
    }, (err) => {
      // Swallow permission-like errors quietly to avoid noisy warnings in Expo Go.
      // Log only when it's a genuine unexpected error.
      if (err && err.message && !/permission|insufficient/i.test(err.message)) {
        console.warn('Notifications: snapshot err', err.message || err);
      }
    });

    return () => {
      if (unsub) unsub();
      unsub = null;
    };
  } catch (e) {
    // Silence initialization errors to avoid exposing environment limitations
    return null;
  }
}

export function cleanupLocalNotifications() {
  if (unsub) unsub();
  unsub = null;
}
