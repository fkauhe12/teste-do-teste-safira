// screens/MoreScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db, firestoreDb } from "../services/firebase";
import { ref, get } from "firebase/database";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

// 🧩 utilitário multiplataforma para imagem
const getLogoSource = () => {
  try {
    const img = require("../assets/images/Logo_safira.png");
    if (Platform.OS === "web") {
      return { uri: img?.default ?? "../assets/images/Logo_safira.png" };
    }
    return img;
  } catch {
    return { uri: "../assets/images/Logo_safira.png" };
  }
};

// conectores comuns em nomes PT-BR que não contam como sobrenome
const CONNECTORS = new Set([
  "da",
  "de",
  "do",
  "das",
  "dos",
  "e",
  "di",
  "du",
  "del",
  "della",
  "van",
  "von",
]);
const stripAccents = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const capitalize = (s = "") => {
  const clean = stripAccents(s.toLowerCase());
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};
const getShortName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return capitalize(parts[0]);

  const first = parts[0];
  let last = parts[parts.length - 1];

  for (let i = parts.length - 1; i >= 1; i--) {
    const p = stripAccents(parts[i]).toLowerCase();
    if (!CONNECTORS.has(p)) {
      last = parts[i];
      break;
    }
  }
  return `${capitalize(first)} ${capitalize(last)}`;
};

const MoreScreen = ({ navigation }) => {
  const logoSource = getLogoSource();

  const [user, setUser] = useState(null);
  const [greetingName, setGreetingName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDriver, setIsDriver] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Busca usuário + nome + roles (via Realtime Database)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setGreetingName("");
        setIsAdmin(false);
        setIsDriver(false);
        setUnreadCount(0);
        return;
      }

      // Nome imediato (displayName ou parte do email)
      const immediate =
        getShortName(firebaseUser.displayName || "") ||
        (firebaseUser.email ? firebaseUser.email.split("@")[0] : "");
      setGreetingName(immediate);

      try {
        const snap = await get(ref(db, `users/${firebaseUser.uid}`));

        if (snap.exists()) {
          const data = snap.val() || {};

          const fullName = (data.fullName || "").trim();
          const short = getShortName(fullName);
          if (short) setGreetingName(short);

          setIsAdmin(!!data.isAdmin);
          setIsDriver(!!data.isDriver);
        } else {
          setIsAdmin(false);
          setIsDriver(false);
        }
      } catch (err) {
        console.warn("MoreScreen: erro lendo /users", err?.message);
        setIsAdmin(false);
        setIsDriver(false);
      }
    });

    return () => unsub();
  }, []);

  // Listener de notificações NÃO lidas para badge
  useEffect(() => {
    if (!firestoreDb) return;
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(firestoreDb, "notifications"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        let count = 0;
        snap.forEach((d) => {
          const data = d.data();
          if (!data.read) count += 1;
        });
        setUnreadCount(count);
      },
      (err) => {
        console.warn("MoreScreen notifications snapshot err", err?.message);
      }
    );

    return () => unsub();
  }, [user]);

  const greetingText = `Olá, ${greetingName || "Visitante"}!`;

  // Botão principal: sempre navega para Log, só muda o texto
  const isLoggedIn = !!user;
  const primaryButtonLabel = isLoggedIn ? "Sair" : "Entrar";

  const handlePrimaryButton = () => {
    navigation.navigate("Log"); // LogScreen continua responsável por login/logout
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header com gradiente */}
        <LinearGradient
          colors={["#0E2E98", "#3E57AC", "#4873FF"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {logoSource ? (
            <Image source={logoSource} style={styles.logo} />
          ) : (
            <View style={styles.logoFallback}>
              <Text style={{ color: "#fff" }}>Logo</Text>
            </View>
          )}

          <Text style={styles.greeting}>{greetingText}</Text>

          <TouchableOpacity
            style={styles.notification}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Ionicons name="notifications-outline" size={24} color="#000" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </LinearGradient>

        {/* Body */}
        <ScrollView style={styles.body} keyboardShouldPersistTaps="always">
          {/* Botão Entrar/Sair */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handlePrimaryButton}
            activeOpacity={0.85}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <LinearGradient
              colors={["#4873FF", "#3E57AC", "#0E2E98"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginGradient}
            >
              <Text style={styles.loginText}>{primaryButtonLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Informações */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Informações</Text>

            <TouchableOpacity style={styles.infoItem}>
              <Ionicons name="pricetag-outline" size={20} color="#000" />
              <Text style={styles.infoText}>Cupons</Text>
            </TouchableOpacity>

            {/* Alterar dados */}
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Ionicons name="create-outline" size={20} color="#000" />
              <Text style={styles.infoText}>Alterar dados</Text>
            </TouchableOpacity>

            {/* Painel Admin - só admin */}
            {isAdmin && (
              <TouchableOpacity
                style={styles.infoItem}
                onPress={() => navigation.navigate("AdminPanel")}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#000"
                />
                <Text style={styles.infoText}>Painel Admin</Text>
              </TouchableOpacity>
            )}

            {/* Meus Pedidos - só para logado */}
            {isLoggedIn && (
              <TouchableOpacity
                style={styles.infoItem}
                onPress={() => navigation.navigate("MyOrders")}
              >
                <Ionicons name="receipt-outline" size={20} color="#000" />
                <Text style={styles.infoText}>Meus Pedidos</Text>
              </TouchableOpacity>
            )}

            {/* Área Entregador - só driver */}
            {isDriver && (
              <TouchableOpacity
                style={styles.infoItem}
                onPress={() => navigation.navigate("EntregadorMap")}
              >
                <Ionicons name="bicycle-outline" size={20} color="#000" />
                <Text style={styles.infoText}>Área do Entregador</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default MoreScreen;

// estilos iguais aos seus
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d9d9d9",
  },
  content: {
    flex: 1,
    marginBottom:
      Platform.OS === "web"
        ? 70
        : Platform.OS === "ios"
        ? 200
        : 200,
  },
  header: {
    height: "18%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 30,
    minHeight: 90,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    borderRadius: 1000,
  },
  logoFallback: {
    width: 60,
    height: 60,
    borderRadius: 1000,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  greeting: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  notification: {
    position: "relative",
    backgroundColor: "#fff",
    borderRadius: 1000,
    padding: 6,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 1000,
    paddingHorizontal: 5,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  body: {
    flex: 1,
  },
  loginButton: {
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  loginGradient: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
  },
});