// services/delivery.js
// Funções para criar pedidos de entrega e atualizar status com notificações in-app.

import { firestoreDb, auth } from "./firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

import { sendInAppNotification } from "./notifications";

// Mensagens amigáveis por status
const STATUS_MESSAGES = {
  pending: "Seu pedido foi recebido e está aguardando processamento.",
  preparing: "Seu pedido está sendo preparado.",
  enroute: "O entregador está a caminho.",
  picked_up: "O entregador retirou o pedido na loja.",
  shipped: "Seu pedido foi enviado.",
  delivered: "Seu pedido foi entregue.",
  cancelled: "Seu pedido foi cancelado.",
  received: "Recebimento do pedido foi confirmado.",
};

function getStatusMessage(status) {
  return (
    STATUS_MESSAGES[status] ||
    `Status do pedido atualizado: ${status || "desconhecido"}.`
  );
}

/**
 * Cria um pedido na coleção `deliveries`.
 */
export async function createDeliveryOrder(order) {
  try {
    if (firestoreDb) {
      const userId = auth?.currentUser?.uid || null;
      const userEmail = auth?.currentUser?.email || null;
      const collRef = collection(firestoreDb, "deliveries");
      const docRef = await addDoc(collRef, {
        ...order,
        userId,
        userEmail,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Notificação in-app: pedido criado
      if (userId) {
        await sendInAppNotification({
          userId,
          title: "Pedido criado",
          body: getStatusMessage("pending"),
          type: "delivery_created",
          orderId: docRef.id,
        });
      }

      return { id: docRef.id, status: "pending" };
    }
  } catch (err) {
    console.warn("createDeliveryOrder: Firestore write failed", err?.message);
  }

  // Fallbacks (caso queira manter)...

  const API_URL =
    process.env.DELIVERY_API_URL ||
    process.env.EXPO_PUBLIC_DELIVERY_API_URL;

  if (API_URL) {
    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return data;
    } catch (err) {
      console.warn("createDeliveryOrder: REST API failed", err?.message);
    }
  }

  console.warn("createDeliveryOrder: using fallback mock");
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          id: `mock-${Date.now()}`,
          status: "pending",
          createdAt: Date.now(),
        }),
      600
    )
  );
}

/**
 * Atualiza o status de um pedido em `deliveries`
 * e cria uma notificação para o usuário dono.
 */
export async function updateDeliveryStatus(orderId, newStatus, extraData = {}) {
  try {
    if (!firestoreDb) return;

    const ref = doc(firestoreDb, "deliveries", orderId);

    await updateDoc(ref, {
      status: newStatus,
      updatedAt: serverTimestamp(),
      ...extraData,
    });

    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const userId = data.userId;
    if (!userId) return;

    const msg = getStatusMessage(newStatus);

    await sendInAppNotification({
      userId,
      title: "Atualização do pedido",
      body: msg,
      type: "delivery_status",
      orderId,
    });
  } catch (err) {
    console.warn("updateDeliveryStatus error", err?.message);
  }
}

export default {
  createDeliveryOrder,
  updateDeliveryStatus,
};