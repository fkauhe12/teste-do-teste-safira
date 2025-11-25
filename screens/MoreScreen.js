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
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import GlobalBottomBar from "../components/GlobalBottomBar";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { ref, get } from "firebase/database";

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
  const [greetingName, setGreetingName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDriver, setIsDriver] = useState(false);

  // Busca nome do usuário logado (displayName instantâneo + atualiza com DB)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setGreetingName("");
        setIsAdmin(false);
        setIsDriver(false);
        return;
      }

      // 1) coloca algo imediato (displayName ou email)
      const immediate =
        getShortName(user.displayName || "") ||
        (user.email ? user.email.split("@")[0] : "");
      setGreetingName(immediate);

      // 2) prioriza claims do token (mais seguro). Se não existir, tenta RTDB como fallback.
      try {
        // força leitura do token para pegar claims atualizadas
        const idRes = await user.getIdTokenResult();
        const claims = idRes.claims || {};
        if (claims.admin) setIsAdmin(true);
        if (claims.driver) setIsDriver(true);

        // se não encontrou claims, tenta RTDB (fallback para dev/testing)
        if (!claims.admin && !claims.driver) {
          const snap = await get(ref(db, `users/${user.uid}`));
          const fullName =
            (snap.exists() && (snap.val()?.fullName || "").trim()) || "";
          const short = getShortName(fullName);
          if (short) setGreetingName(short);

          if (snap.exists()) {
            const data = snap.val() || {};
            const role = (data.role || "").toLowerCase();
            const rolesObj = data.roles || {};
            const isAdminFlag = !!data.isAdmin || role === "admin" || !!rolesObj.admin;
            const isDriverFlag = !!data.isDriver || role === "driver" || !!rolesObj.driver;
            setIsAdmin(Boolean(isAdminFlag));
            setIsDriver(Boolean(isDriverFlag));
          }
        }
      } catch (err) {
        console.warn('MoreScreen: failed to read token or DB', err?.message);
      }
    });
    return () => unsub();
  }, []);

  const greetingText = `Olá, ${greetingName || "Visitante"}!`;

  // Dev helper: mostrar UID e claims para facilitar testes
  const [devInfo, setDevInfo] = useState(null);
  const refreshClaims = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      await user.getIdTokenResult(true);
      const idRes = await user.getIdTokenResult();
      setDevInfo({ uid: user.uid, email: user.email, claims: idRes.claims });
    } catch (e) {
      console.warn('refreshClaims error', e?.message);
    }
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

          <TouchableOpacity style={styles.notification} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        {/* Body */}
        <ScrollView style={styles.body} keyboardShouldPersistTaps="always">
          {/* Botão Entrar */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Log")}
            activeOpacity={0.85}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <LinearGradient
              colors={["#4873FF", "#3E57AC", "#0E2E98"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginGradient}
            >
              <Text style={styles.loginText}>Entrar</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Informações */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Informações</Text>

            <TouchableOpacity style={styles.infoItem}>
              <Ionicons name="pricetag-outline" size={20} color="#000" />
              <Text style={styles.infoText}>Cupons</Text>
            </TouchableOpacity>

            {/* Novo: Alterar dados */}
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Ionicons name="create-outline" size={20} color="#000" />
              <Text style={styles.infoText}>Alterar dados</Text>
            </TouchableOpacity>

            {/* Área Admin - visível apenas para admins */}
            {isAdmin && (
              <TouchableOpacity
                style={styles.infoItem}
                onPress={() => navigation.navigate("AdminPanel")}
              >
                <Ionicons name="shield-checkmark-outline" size={20} color="#000" />
                <Text style={styles.infoText}>Painel Admin</Text>
              </TouchableOpacity>
            )}

            {/* Meus Pedidos - disponível para usuário logado */}
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate('MyOrders')}
            >
              <Ionicons name="receipt-outline" size={20} color="#000" />
              <Text style={styles.infoText}>Meus Pedidos</Text>
            </TouchableOpacity>

            {/* Área Entregador - visível apenas para entregadores */}
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

          {/* Dev debug removed - production build */}
        </ScrollView>
      </View>

      {/* GlobalBottomBar is rendered by AppNavigator; remove duplicate to avoid overlays */}
    </View>
  );
};

export default MoreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d9d9d9",
  },
  content: {
    flex: 1,
    marginBottom: Platform.OS === "web" ? 70 : Platform.OS === "ios" ?200: 200,
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
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
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
  btnSmall: {
    backgroundColor: '#425bab',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
});