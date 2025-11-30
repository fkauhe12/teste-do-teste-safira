// services/notifications.js
import { firestoreDb, auth } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Platform, ToastAndroid, Alert } from "react-native";

let unsub = null;

export async function sendInAppNotification({
  userId,
  title,
  body,
  type,
  orderId,
  productId,
}) {
  try {
    if (!firestoreDb) return;

    const currentUser = auth.currentUser;
    const finalUserId = userId || currentUser?.uid;
    if (!finalUserId) return;

    await addDoc(collection(firestoreDb, "notifications"), {
      userId: finalUserId,
      title: title || "Notificação",
      body: body || "",
      type: type || "generic", // "cart", "delivery_status", "delivery_created" etc.
      orderId: orderId || null,
      productId: productId || null,
      createdAt: serverTimestamp(),
      read: false,
    });
  } catch (e) {
    console.warn("sendInAppNotification error", e?.message);
  }
}

export async function initLocalNotifications() {
  const user = auth?.currentUser;
  if (!user || !firestoreDb) return null;

  const listenerStartedAt = Date.now();

  try {
    const q = query(
      collection(firestoreDb, "notifications"),
      where("userId", "==", user.uid)
    );

    unsub = onSnapshot(
      q,
      (snap) => {
        try {
          snap.docChanges().forEach((change) => {
            if (change.type !== "added") return;

            const n = change.doc?.data ? change.doc.data() : null;
            if (!n) return;

            // Não mostrar popup para notificações de sacola
            if (n.type === "cart") return;

            // Ignorar notificações antigas (backlog antes do listener)
            let createdAtMs = 0;
            if (n.createdAt?.toDate) {
              createdAtMs = n.createdAt.toDate().getTime();
            } else if (n.createdAt?.seconds) {
              createdAtMs = n.createdAt.seconds * 1000;
            } else if (typeof n.createdAt === "number") {
              createdAtMs = n.createdAt;
            }

            if (createdAtMs && createdAtMs < listenerStartedAt - 2000) {
              return;
            }

            const title = n.title || "Nova notificação";
            const body = n.body || "";

            try {
              if (
                Platform.OS === "android" &&
                ToastAndroid &&
                typeof ToastAndroid.show === "function"
              ) {
                ToastAndroid.show(`${title}\n${body}`, ToastAndroid.LONG);
              } else {
                Alert.alert(title, body);
              }
            } catch (showErr) {
              // ignora falha de UI
            }
          });
        } catch (innerErr) {
          // ignora erro interno
        }
      },
      (err) => {
        if (
          err &&
          err.message &&
          !/permission|insufficient/i.test(err.message)
        ) {
          console.warn("Notifications: snapshot err", err.message || err);
        }
      }
    );

    return () => {
      if (unsub) unsub();
      unsub = null;
    };
  } catch (e) {
    return null;
  }
}

export function cleanupLocalNotifications() {
  if (unsub) unsub();
  unsub = null;
}