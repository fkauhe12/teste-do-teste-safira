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
  Alert,
  Dimensions,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets, SafeAreaProvider } from "react-native-safe-area-context";
import CardItem from "../components/CardItem";
import GlobalBottomBar from "../components/GlobalBottomBar";
import { produtos } from "../data/produtos";
import { anuncios } from "../data/anuncios";
import { mockUser } from "../data/mockData";

const { width } = Dimensions.get("window");

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

  // Animações de zoom
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

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
    <SafeAreaProvider style={styles.container} edges={["top", "left", "right"]}>
      <GlobalBottomBar currentRouteName="Home" navigate={navigation.navigate} />

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          marginBottom:
            Platform.OS === "web" ? 70 : Platform.OS === "ios" ? 60 : 60,
        }}
      >
        {/* HEADER */}
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

        {/* CONTEÚDO */}
        <ScrollView
          contentContainerStyle={[
            styles.containerConteudo,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* CARROSSEL DE ANÚNCIOS */}
          <View style={{ marginTop: 10 }}>
            <Text style={styles.carouselTitle}>Anúncios de Recomendação</Text>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.carousel}
            >
              {anuncios.map((anuncio) => (
                <ImageBackground
                  key={anuncio.id}
                  source={anuncio.URLImagem}
                  style={[styles.anuncioCard, { width: width * 0.9 }]}
                  imageStyle={{ borderRadius: 15 }}
                >
                  {/* Gradiente escuro para destacar o texto */}
                  <LinearGradient
                    colors={["rgba(0,0,0,0.1)", "transparent"]}
                    style={styles.anuncioOverlay}
                  >
                    <Text style={styles.anuncioTitulo}>{anuncio.titulo}</Text>
                    <Text style={styles.anuncioDescricao}>{anuncio.descricao}</Text>
                  </LinearGradient>
                </ImageBackground>
              ))}
            </ScrollView>
          </View>

          {/* SEÇÃO MAIS VENDIDOS */}
          <TouchableOpacity onPress={handleZoomIn} activeOpacity={0.8}>
            <Text style={styles.sectionTitle}>Mais Vendidos!</Text>
          </TouchableOpacity>

          <View style={styles.productsGrid}>
            {produtos.map((produto) => (
              <CardItem
                key={produto.id}
                title={produto.nome}
                description={`${produto.descricao} - ${produto.dosagem}`}
                imageUrl={produto.imageUrl}
                price={
                  typeof produto.preco === "number" ? produto.preco : undefined
                }
                discount={produto.discount ?? 0}
                rating={produto.rating ?? 0}
                style={styles.productCard}
                additionalInfo={`Forma: ${produto.forma}`}
                onPress={() => {
                  Alert.alert(
                    "Adicionar à saloca?",
                    `Deseja adicionar ${produto.nome} ${produto.dosagem} à sua saloca?`,
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Sim, adicionar",
                        onPress: () => {
                          Alert.alert(
                            "Sucesso",
                            "Produto adicionado à saloca!"
                          );
                          navigation.navigate("CartScreen", {
                            product: produto,
                          });
                        },
                      },
                    ]
                  );
                }}
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
    marginTop: 10,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  anuncioCard: {
    borderRadius: 15,
    height: 150,
    marginHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  anuncioTitulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000ff",
    marginBottom: 5,
  },
  anuncioDescricao: {
    fontSize: 14,
    color: "#000002ff",
    textAlign: "center",
    fontWeight: "bold",
    paddingHorizontal: 20,
  },
  anuncioOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    paddingHorizontal: 15,
  },


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
    paddingHorizontal: 5,
  },
  productCard: {
    width: "48%",
    marginBottom: 15,
  },
});

