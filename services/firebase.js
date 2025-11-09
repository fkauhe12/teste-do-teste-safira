// services/firebase.js
import { getApps, getApp, initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  serverTimestamp,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** 🔧 Config (.env) */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_apiKey,
  authDomain: process.env.EXPO_PUBLIC_authDomain,
  projectId: process.env.EXPO_PUBLIC_projectId,
  storageBucket: process.env.EXPO_PUBLIC_storageBucket,
  messagingSenderId: process.env.EXPO_PUBLIC_messagingSenderId,
  appId: process.env.EXPO_PUBLIC_appId,
  databaseURL: process.env.EXPO_PUBLIC_databaseURL,
};

/** 🚀 Inicializa o app (uma vez) */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/** 💾 RTDB / 🔥 Firestore */
const db = getDatabase(app);
const firestoreDb = getFirestore(app);

/** 🔧 Sanitiza a chave para o SecureStore (aceita apenas [A-Za-z0-9._-]) */
const sanitizeKey = (key) =>
  String(key ?? "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 512);

/**
 * 🔐 Adaptador híbrido:
 * - Usa chave sanitizada no SecureStore.
 * - Para migração, lê/remove do AsyncStorage usando a chave ORIGINAL.
 * - Nunca rejeita Promises (evita warnings).
 */
const hybridSecureAdapter = {
  getItem: async (key) => {
    if (Platform.OS === "web") return null;
    const sKey = sanitizeKey(key);

    // 1) Tenta SecureStore (com chave sanitizada)
    try {
      const v = await SecureStore.getItemAsync(sKey);
      if (v != null) return v;
    } catch (e) {
      if (__DEV__) console.warn("[AuthStorage] SecureStore.getItem error:", sKey, e);
    }

    // 2) Migração: tenta AsyncStorage (com chave original)
    try {
      const legacy = await AsyncStorage.getItem(key);
      if (legacy != null) {
        try {
          await SecureStore.setItemAsync(sKey, legacy);
          await AsyncStorage.removeItem(key);
        } catch (migrateErr) {
          if (__DEV__)
            console.warn("[AuthStorage] migrate -> SecureStore.setItem error:", sKey, migrateErr);
          // Mesmo se a cópia falhar, retornamos o valor legacy para não quebrar
        }
      }
      return legacy;
    } catch (e) {
      if (__DEV__) console.warn("[AuthStorage] AsyncStorage.getItem error:", key, e);
      return null;
    }
  },

  setItem: async (key, value) => {
    if (Platform.OS === "web") return;
    const sKey = sanitizeKey(key);
    try {
      await SecureStore.setItemAsync(sKey, value);
    } catch (e) {
      if (__DEV__) console.warn("[AuthStorage] SecureStore.setItem error:", sKey, e);
    }
    // Limpa legado (chave original) sem quebrar
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },

  removeItem: async (key) => {
    if (Platform.OS === "web") return;
    const sKey = sanitizeKey(key);
    try {
      await SecureStore.deleteItemAsync(sKey);
    } catch (e) {
      if (__DEV__) console.warn("[AuthStorage] SecureStore.deleteItem error:", sKey, e);
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

/** 🔐 Auth com persistência segura (mobile) e padrão (web) */
let auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(hybridSecureAdapter),
    });
  } catch {
    auth = getAuth(app);
  }
}

/** ✅ Exportações */
export {
  app,
  db,
  firestoreDb,
  auth,
  // RTDB helpers
  ref,
  set,
  get,
  child,
  serverTimestamp,
  query,
  orderByChild,
  equalTo,
  // Auth helpers
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
};