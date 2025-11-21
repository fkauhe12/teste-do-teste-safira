// services/delivery.js
// Funções para criar pedidos de entrega.
// Estratégia: tenta usar Firestore (se estiver configurado) para criar documento em
// `deliveries` e retornar o id/status. Se Firestore não estiver disponível, tenta
// uma API REST externa. Se nenhuma estiver disponível, usa um fallback mock.

import { firestoreDb, auth } from "./firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";

export async function createDeliveryOrder(order) {
  // 1) Tenta Firestore se disponível
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

      // Retorna id e campo status
      return { id: docRef.id, status: "pending" };
    }
  } catch (err) {
    console.warn("createDeliveryOrder: Firestore write failed", err?.message);
  }

  // 2) Se houver uma API REST configurada via env, tente-a (substitua a URL)
  const API_URL = process.env.DELIVERY_API_URL || process.env.EXPO_PUBLIC_DELIVERY_API_URL;
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

  // 3) Fallback mock local
  console.warn("createDeliveryOrder: using fallback mock");
  return new Promise((resolve) =>
    setTimeout(() => resolve({ id: `mock-${Date.now()}`, status: "pending", createdAt: Date.now() }), 600),
  );
}

export default {
  createDeliveryOrder,
};
