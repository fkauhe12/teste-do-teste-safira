// firebase.js
import { initializeApp } from "firebase/app";
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
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_apiKey,
  authDomain: process.env.EXPO_PUBLIC_authDomain,
  projectId: process.env.EXPO_PUBLIC_projectId,
  storageBucket: process.env.EXPO_PUBLIC_storageBucket,
  messagingSenderId: process.env.EXPO_PUBLIC_messagingSenderId,
  appId: process.env.EXPO_PUBLIC_appId,
  databaseURL: process.env.EXPO_PUBLIC_databaseURL,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export {
  app,
  db,
  auth,
  // RTDB
  ref,
  set,
  get,
  child,
  serverTimestamp,
  query,
  orderByChild,
  equalTo,
  // Auth
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
};