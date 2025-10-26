import React, { useRef, useState, useEffect } from "react";
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

const PaginationDots = ({ total, activeIndex, onDotPress }) => (
  <View style={styles.dotContainer}>
    {Array.from({ length: total }).map((_, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => onDotPress(index)}
        style={[
          styles.dot,
          activeIndex === index ? styles.dotActive : styles.dotInactive,
        ]}
      />
    ))}
  </View>
);

export default function HomeScreen({ navigation }) {
  const logoSource = getLogoSource();
  const insets = useSafeAreaInsets();
  const numAnuncios = anuncios.length;
  const AUTO_SCROLL_INTERVAL = 4000;
  const loopItemWidth = width * 0.9 + 20;

  const [activeIndex, setActiveIndex] = useState(1);
  const scrollViewRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const loopedAnuncios =
    numAnuncios > 0
      ? [anuncios[numAnuncios - 1], ...anuncios, anuncios[0]]
      : [];

  // Auto-scroll fixado
  useEffect(() => {
    if (numAnuncios === 0) return;

    let intervalId;

    const startAutoScroll = () => {
      intervalId = setInterval(() => {
        setActiveIndex((prevIndex) => {
          let nextIndex = prevIndex + 1;
          scrollViewRef.current?.scrollTo({
            x: nextIndex * loopItemWidth,
            animated: true,
          });
          return nextIndex;
        });
      }, AUTO_SCROLL_INTERVAL);
    };

    startAutoScroll();

    return () => clearInterval(intervalId);
  }, [numAnuncios, loopItemWidth]);

  // Corrige o loop ao chegar no fim/início
  const handleMomentumScrollEnd = (event) => {
    const offset = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offset / loopItemWidth);

    if (newIndex !== activeIndex) setActiveIndex(newIndex);

    if (newIndex === numAnuncios + 1) {
      // voltou pro primeiro real
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: loopItemWidth,
          animated: false,
        });
        setActiveIndex(1);
      }, 100);
    } else if (newIndex === 0) {
      // voltou pro último real
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: numAnuncios * loopItemWidth,
          animated: false,
        });
        setActiveIndex(numAnuncios);
      }, 100);
    }
  };

  const handleDotPress = (index) => {
    const targetIndexInLoop = index + 1;
    const xOffset = targetIndexInLoop * loopItemWidth;
    scrollViewRef.current?.scrollTo({
      x: xOffset,
      animated: true,
    });
    setActiveIndex(targetIndexInLoop);
  };

  const handleZoomIn = () => {};

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

        <ScrollView
          contentContainerStyle={[
            styles.containerConteudo,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginTop: 10 }}>
            <Text style={styles.carouselTitle}>Anúncios de Recomendação</Text>

            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.carousel}
              pagingEnabled
              onMomentumScrollEnd={handleMomentumScrollEnd}
              scrollEventThrottle={16}
            >
              {loopedAnuncios.map((anuncio, index) => (
                <ImageBackground
                  key={index}
                  source={anuncio.URLImagem}
                  style={[styles.anuncioCard, { width: width * 0.9 }]}
                  imageStyle={{ borderRadius: 15 }}
                >
                  <LinearGradient
                    colors={["rgba(0,0,0,0.1)", "transparent"]}
                    style={styles.anuncioOverlay}
                  >
                    <Text style={styles.anuncioTitulo}>{anuncio.titulo}</Text>
                    <Text style={styles.anuncioDescricao}>
                      {anuncio.descricao}
                    </Text>
                  </LinearGradient>
                </ImageBackground>
              ))}
            </ScrollView>

            {numAnuncios > 1 && (
              <PaginationDots
                total={numAnuncios}
                activeIndex={activeIndex - 1}
                onDotPress={handleDotPress}
              />
            )}
          </View>

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
                          Alert.alert("Sucesso", "Produto adicionado à saloca!");
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
    height: "20%",
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
  carousel: { marginTop: 10 },
  carouselTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginLeft: 10,
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
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  dotInactive: { backgroundColor: "#ccc" },
  dotActive: {
    backgroundColor: "#0E2E98",
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 20,
    marginLeft: 10,
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

