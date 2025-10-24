import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// 🧩 utilitário multiplataforma para a imagem
const getCartIconSource = () => {
  try {
    const img = require("../assets/icons/icon_car_vazio.png");
    if (Platform.OS === "web") {
      return { uri: img?.default ?? "../assets/icons/icon_car_vazio.png" };
    }
    return img;
  } catch {
    return { uri: "../assets/icons/icon_car_vazio.png" };
  }
};

export default function CartScreen({ navigation }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    // Slide para cima ao abrir
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const closeModal = () => {
    // Slide para baixo ao fechar
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 800,
      useNativeDriver: true,
    }).start(() => navigation.goBack());
  };

  return (
    <View style={styles.overlay}>
      {/* Overlay escuro atrás */}
      <View style={styles.backgroundOverlay} />

      <Animated.View
        style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={closeModal}>
            <Ionicons
              name="arrow-back-sharp"
              size={24}
              color="rgba(0, 0, 0, 0.32)"
            />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo principal */}
        <View style={styles.container_cesta}>
          <Text style={styles.text}>Cesta Vazia</Text>
          <Image source={getCartIconSource()} style={styles.imagem} />
          <Text style={styles.text}>Adicione Produtos</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  container: {
    height: "93%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    color: "rgba(0, 0, 0, 0.32)",
    marginLeft: 4,
    fontSize: 19,
    fontWeight: "bold",
  },
  container_cesta: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 25,
    fontWeight: "bold",
  },
  imagem: {
    width: 300,
    height: 300,
    resizeMode: "contain",
    marginVertical: 20,
  },
});
