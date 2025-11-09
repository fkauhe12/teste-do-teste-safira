// screens/HomeScreen.js
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
  Dimensions,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets, SafeAreaProvider } from "react-native-safe-area-context";
import CardItem from "../components/CardItem";
import GlobalBottomBar from "../components/GlobalBottomBar";
import { anuncios } from "../data/anuncios";
import { onAuthStateChanged } from "firebase/auth";
import { firestoreDb, auth, db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import { ref, get } from "firebase/database";
import { loadProdutosFromCache, saveProdutosToCache } from "../services/productCache";

const { width } = Dimensions.get("window");

//
// ----------- funções de nome seguras -----------
//
const CONNECTORS = new Set(["da","de","do","das","dos","e","di","du","del","della","van","von"]);

const stripAccents = (s) => {
  if (typeof s !== "string") return "";
  try {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    return "";
  }
};

const capitalize = (s) => {
  if (typeof s !== "string" || !s.trim()) return "";
  const clean = stripAccents(s);
  if (!clean) return "";
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
};

const getShortName = (fullName) => {
  if (typeof fullName !== "string") return "";
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/).filter(Boolean);
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

//
// ----------- componente de paginação -----------
//
const PaginationDots = ({ total, activeIndex, onDotPress }) => (
  <View style={styles.dotContainer}>
    {Array.from({ length: total }).map((_, i) => (
      <TouchableOpacity
        key={i}
        onPress={() => onDotPress(i)}
        style={[styles.dot, activeIndex === i ? styles.dotActive : styles.dotInactive]}
      />
    ))}
  </View>
);

//
// ----------- componente principal -----------
//
export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const logo = require("../assets/images/Logo_safira.png");
  const numAnuncios = anuncios.length;
  const loopItemWidth = width * 0.9 + 20;
  const scrollViewRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(1);
  const [greetingName, setGreetingName] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  //
  // 🔥 Carrega produtos com cache (AsyncStorage) + Firestore
  //
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) Tenta cache primeiro (UX rápido)
        const cached = await loadProdutosFromCache();
        if (mounted && cached?.length) {
          setProdutos(cached);
          setLoading(false);
        }

        // 2) Busca online e atualiza lista + cache
        const snap = await getDocs(collection(firestoreDb, "produtos"));
        const dados = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        if (mounted) {
          setProdutos(dados);
          setLoading(false);
        }
        await saveProdutosToCache(dados);
      } catch (e) {
        console.error("Erro ao carregar produtos:", e);
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  //
  // 🔥 Agrupamentos
  //
  const topDoMomento = produtos.filter((p) => p.topDoMomento);
  const maisPesquisados = produtos.filter((p) => p.maisPesquisado);
  const maisVendidos = produtos.filter((p) => p.maisVendido);

  //
  // 🔐 Saudação com nome + sobrenome
  //
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setGreetingName("");
      try {
        const snap = await get(ref(db, `users/${user.uid}`));
        const fullName =
          (snap.exists() && snap.val().fullName) || user.displayName || "";
        const short = getShortName(fullName);
        if (short) setGreetingName(short);
        else if (user.email) setGreetingName(user.email.split("@")[0]);
        else setGreetingName("");
      } catch {
        const fallback = user.displayName || user.email?.split("@")[0] || "";
        setGreetingName(fallback);
      }
    });
    return () => unsub();
  }, []);

  //
  // 🔁 Auto‑scroll do carrossel
  //
  useEffect(() => {
    if (numAnuncios === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = prev + 1;
        scrollViewRef.current?.scrollTo({ x: next * loopItemWidth, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [numAnuncios, loopItemWidth]);

  const handleMomentumScrollEnd = (e) => {
    const offset = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offset / loopItemWidth);
    if (newIndex !== activeIndex) setActiveIndex(newIndex);
    if (newIndex === numAnuncios + 1) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: loopItemWidth, animated: false });
        setActiveIndex(1);
      }, 100);
    } else if (newIndex === 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: numAnuncios * loopItemWidth,
          animated: false,
        });
        setActiveIndex(numAnuncios);
      }, 100);
    }
  };

  const handleDotPress = (i) => {
    const target = i + 1;
    scrollViewRef.current?.scrollTo({ x: target * loopItemWidth, animated: true });
    setActiveIndex(target);
  };

  const greetingText = `Olá, ${greetingName || "Visitante"}!`;

  //
  // ---------------- Renderização ----------------
  //
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#0E2E98" size="large" />
        <Text>Carregando produtos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={styles.container} edges={["top", "left", "right"]}>
      <GlobalBottomBar currentRouteName="Home" navigate={navigation.navigate} />

      <Animated.View style={{ flex: 1, marginBottom: 60 }}>
        {/* 🔵 Cabeçalho */}
        <LinearGradient
          colors={["#0E2E98", "#3E57AC", "#4873FF"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Image source={logo} style={styles.logo} />
          <Text style={styles.greeting}>{greetingText}</Text>
          <TouchableOpacity style={styles.notification}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 100 },
          ]}
        >
          {/* 🔆 Carrossel de anúncios */}
          <Text style={styles.carouselTitle}>Anúncios de Recomendação</Text>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            onMomentumScrollEnd={handleMomentumScrollEnd}
            showsHorizontalScrollIndicator={false}
            style={styles.carousel}
          >
            {[anuncios[numAnuncios - 1], ...anuncios, anuncios[0]].map(
              (anuncio, i) => (
                <ImageBackground
                  key={i}
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
              )
            )}
          </ScrollView>
          {numAnuncios > 1 && (
            <PaginationDots
              total={numAnuncios}
              activeIndex={activeIndex - 1}
              onDotPress={handleDotPress}
            />
          )}

          {/* 🔝 Top do Momento */}
          {topDoMomento.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🔥 Top do Momento</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {topDoMomento.map((p) => (
                  <CardItem
                    key={p.id}
                    title={p.nome}
                    description={p.descricao}
                    price={p.preco}
                    imageUrl={p.imageUrl}
                    style={styles.horizontalCard}
                    onPress={() =>
                      navigation.navigate("ProductDetail", { produto: p })
                    }
                  />
                ))}
              </ScrollView>
            </>
          )}

          {/* 💎 Mais Vendidos */}
          {maisVendidos.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>💎 Mais Vendidos</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {maisVendidos.map((p) => (
                  <CardItem
                    key={p.id}
                    title={p.nome}
                    description={p.descricao}
                    price={p.preco}
                    imageUrl={p.imageUrl}
                    style={styles.horizontalCard}
                    onPress={() =>
                      navigation.navigate("ProductDetail", { produto: p })
                    }
                  />
                ))}
              </ScrollView>
            </>
          )}

          {/* 📈 Mais Pesquisados */}
          {maisPesquisados.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>📈 Mais Pesquisados</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {maisPesquisados.map((p) => (
                  <CardItem
                    key={p.id}
                    title={p.nome}
                    description={p.descricao}
                    price={p.preco}
                    imageUrl={p.imageUrl}
                    style={styles.horizontalCard}
                    onPress={() =>
                      navigation.navigate("ProductDetail", { produto: p })
                    }
                  />
                ))}
              </ScrollView>
            </>
          )}

          {/* 🛒 Todos os Produtos */}
          <Text style={styles.sectionTitle}>🛒 Produtos</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {produtos.map((p) => (
              <CardItem
                key={p.id}
                title={p.nome}
                description={p.descricao}
                price={p.preco}
                imageUrl={p.imageUrl}
                style={styles.horizontalCard}
                onPress={() =>
                  navigation.navigate("ProductDetail", { produto: p })
                }
              />
            ))}
          </ScrollView>
        </ScrollView>
      </Animated.View>
    </SafeAreaProvider>
  );
}

//
// ----------- estilos -----------
//
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#d9d9d9" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  logo: { width: 60, height: 60, resizeMode: "contain", borderRadius: 100 },
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
  content: { paddingHorizontal: 10 },

  carouselTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginLeft: 10,
    marginTop: 15,
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
    color: "#000",
    marginBottom: 5,
  },
  anuncioDescricao: {
    fontSize: 14,
    color: "#000",
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
  dot: { width: 10, height: 10, borderRadius: 5, marginHorizontal: 5 },
  dotInactive: { backgroundColor: "#ccc" },
  dotActive: { backgroundColor: "#0E2E98", width: 12, height: 12, borderRadius: 6 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 20,
    marginLeft: 10,
  },
  horizontalList: { paddingHorizontal: 12 },
  horizontalCard: { width: 180, marginRight: 12 },
});