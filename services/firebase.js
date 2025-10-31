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
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/** 🔧 Configuração (.env) */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_apiKey,
  authDomain: process.env.EXPO_PUBLIC_authDomain,
  projectId: process.env.EXPO_PUBLIC_projectId,
  storageBucket: process.env.EXPO_PUBLIC_storageBucket,
  messagingSenderId: process.env.EXPO_PUBLIC_messagingSenderId,
  appId: process.env.EXPO_PUBLIC_appId,
  databaseURL: process.env.EXPO_PUBLIC_databaseURL,
};

/** 🚀 Inicializa o app (só uma vez) */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/** 💾 Realtime Database */
const db = getDatabase(app);

/** 🔥 Firestore */
const firestoreDb = getFirestore(app);

/** 🔐 Auth com persistência garantida */
let auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  // ⚠️ Nunca chame getAuth antes! InitializeAuth precisa vir primeiro.
  const existingApps = getApps();
  // Se não houver Auth criado ainda, inicializa corretamente
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    // Se já estava inicializado por algum outro módulo, pega a instância
    auth = getAuth(app);
  }
}

/** ✅ Exportações */
export {
  app,
  db,
  firestoreDb,
  auth,
  ref,
  set,
  get,
  child,
  serverTimestamp,
  query,
  orderByChild,
  equalTo,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
};