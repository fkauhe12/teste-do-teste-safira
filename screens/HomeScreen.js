import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets, SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import CardItem from '../components/CardItem';
import GlobalBottomBar from '../components/GlobalBottomBar';
import { mockProducts, mockUser } from '../data/mockData';

// 🧩 Imagem compatível com Web e mobile
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

export default function HomeScreen({ navigation }) {
  const logoSource = getLogoSource();
  const insets = useSafeAreaInsets();

  // valores de animação
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // função para aplicar o zoom‑in
  const handleZoomIn = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 250,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.in(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  return (
    <SafeAreaProvider style={styles.container} edges={['top', 'left', 'right']}>
      <GlobalBottomBar currentRouteName="Home" navigate={navigation.navigate} />
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          marginBottom: Platform.OS === 'web' ? 70 : Platform.OS === 'ios' ? 60 : 60,
        }}
      >
        {/* Header */}
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
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Logo</Text>
            </View>
          )}
          <Text style={styles.greeting}>Olá, {mockUser.name}!</Text>
          <TouchableOpacity style={styles.notification}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        {/* Corpo / Conteúdo */}
        <ScrollView
          contentContainerStyle={[
            styles.containerConteudo,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.carousel}>
            <Text style={styles.carouselText}>Anúncios de Recomendação</Text>
          </View>

          {/* Botão com efeito de zoom‑in */}
          <TouchableOpacity onPress={handleZoomIn} activeOpacity={0.8}>
            <Text style={styles.sectionTitle}>Mais Vendidos!</Text>
          </TouchableOpacity>

          <View style={styles.productsGrid}>
            {mockProducts.map((product, index) => (
              <CardItem
                key={product.id}
                title={product.title}
                description={product.description}
                price={product.price}
                imageUrl={product.imageUrl}
                discount={product.discount}
                rating={product.rating}
                style={styles.productCard}
                onPress={() => navigation.navigate('CartScreen', { product })}
              />
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#d9d9d9" },

  // Header
  header: {
    height:"18%",  
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

  containerConteudo: { paddingHorizontal: 10 },
  carousel: {
    backgroundColor: "#B0BEC5",
    borderRadius: 10,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  carouselText: { color: "#fff", fontSize: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 20,
  },
  productsGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-between",
    paddingHorizontal: 5
  },
  productCard: {
    width: "48%",
    marginBottom: 15,
  },
  imagePlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderRadius: 8,
  },
  productName: { fontSize: 14, fontWeight: "600" },
});