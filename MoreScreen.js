import React from "react";
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
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// 🧩 utilitário multiplataforma para imagem
const getLogoSource = () => {
  try {
    const img = require("../assets/Logo_safira.png"); // <-- caminho ajustado
    if (Platform.OS === "web") {
      return { uri: img?.default ?? "../assets/Logo_safira.png" };
    }
    return img;
  } catch {
    // fallback leve, caso o arquivo não exista ou a importação falhe
    return { uri: "../assets/Logo_safira.png" };
  }
};

export default function MoreScreen({ navigation }) {
  const logoSource = getLogoSource();

  return (
    <View style={styles.container}>
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

        <Text style={styles.greeting}>Olá, Visitante!</Text>

        <TouchableOpacity style={styles.notification}>
          <Ionicons name="notifications-outline" size={24} color="#000" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* Body */}
      <View style={styles.body}>
        {/* Botão Entrar */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate("LogScreen")}
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
        <ScrollView
          style={styles.infoSection}
          contentContainerStyle={styles.infoContent}
        >
          <Text style={styles.infoTitle}>Informações</Text>

          <TouchableOpacity style={styles.infoItem}>
            <Ionicons name="pricetag-outline" size={20} color="#000" />
            <Text style={styles.infoText}>Cupons</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#000" />
            <Text style={styles.infoText}>Endereços</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoItem}>
            <MaterialIcons name="chat-bubble-outline" size={20} color="#000" />
            <Text style={styles.infoText}>Fale conosco</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d9d9d9",
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 30,
    minHeight: 90,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logo: { width: 60, height: 60, resizeMode: "contain", borderRadius: 1000 },
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
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },

  body: { flex: 4 },

  // Botão "Entrar"
  loginButton: { margin: 20, borderRadius: 10, overflow: "hidden" },
  loginGradient: {
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 10,
  },
  loginText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  // Seção de informações
  infoSection: { marginHorizontal: 20, marginTop: 10 },
  infoContent: { paddingBottom: 120 },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#666",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  infoText: { marginLeft: 10, fontSize: 16, color: "#000" },
});