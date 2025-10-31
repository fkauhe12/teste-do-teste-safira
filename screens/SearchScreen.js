import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import GlobalBottomBar from "../components/GlobalBottomBar";
import CardItem from "../components/CardItem";
import { firestoreDb } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Carrega produtos e monta categorias automáticas
  useEffect(() => {
    const fetchData = async () => {
      try {
        const produtosSnap = await getDocs(collection(firestoreDb, "produtos"));
        const produtosData = produtosSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const categoriasSet = new Set(
          produtosData.map((p) => p.categoria).filter(Boolean)
        );
        const categoriasData = Array.from(categoriasSet).map((nome) => ({
          id: nome,
          nome,
          icone: "pricetag-outline",
          cor: "#4873FF",
        }));

        setProdutos(produtosData);
        setCategorias(categoriasData);
      } catch (error) {
        console.error("⚠️ Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🔍 Filtro por texto e categoria
  const filteredProducts = produtos.filter((item) => {
    const matchesQuery =
      item.nome?.toLowerCase().includes(query.toLowerCase()) || false;
    const matchesCategory = selectedCategory
      ? item.categoria === selectedCategory
      : true;
    return matchesQuery && matchesCategory;
  });

  // 🔥 Listas especiais
  const topDoMomento = produtos.filter((p) => p.topDoMomento);
  const maisPesquisados = produtos.filter((p) => p.maisPesquisado);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0E2E98" />
        <Text>Carregando produtos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔵 Cabeçalho */}
      <LinearGradient
        colors={["#0E2E98", "#3E57AC", "#4873FF"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#111" />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Digite o nome do produto..."
            placeholderTextColor="#666"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={20} color="#111" />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      {/* 🧾 Conteúdo */}
      <View style={styles.content}>
        <ScrollView style={styles.scrollContent}>
          {/* 🏷️ Categorias */}
          <Text style={styles.sectionTitle}>Categorias</Text>
          <View style={styles.categories}>
            {categorias.length === 0 ? (
              <Text style={{ marginLeft: 16, color: "#777" }}>
                Nenhuma categoria encontrada.
              </Text>
            ) : (
              categorias.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory === cat.nome && styles.categoryActive,
                  ]}
                  onPress={() =>
                    setSelectedCategory(
                      selectedCategory === cat.nome ? null : cat.nome
                    )
                  }
                >
                  <Ionicons
                    name={cat.icone || "pricetag-outline"}
                    size={18}
                    color={cat.cor || "#000"}
                  />
                  <Text style={styles.categoryText}>{cat.nome}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* 🛍️ Produtos — AGORA EM SCROLL HORIZONTAL */}
          <Text style={styles.sectionTitle}>
            {selectedCategory ? selectedCategory : "Produtos"}
          </Text>
          {filteredProducts.length === 0 ? (
            <Text style={styles.noResults}>Nenhum produto encontrado.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {filteredProducts.map((item) => (
                <CardItem
                  key={item.id}
                  title={item.nome}
                  description={item.descricao}
                  price={Number(item.preco)}
                  imageUrl={item.imageUrl}
                  discount={item.desconto || 0}
                  rating={item.rating || 0}
                  onPress={() =>
                    navigation.navigate("ProductDetail", { produto: item })
                  }
                  onAdd={() => console.log(`Adicionado: ${item.nome}`)}
                  style={styles.horizontalCard}
                />
              ))}
            </ScrollView>
          )}

          {/* ⭐ Top do momento */}
          {topDoMomento.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🔥 Top do Momento</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {topDoMomento.map((item) => (
                  <CardItem
                    key={item.id}
                    title={item.nome}
                    description={item.descricao}
                    price={Number(item.preco)}
                    imageUrl={item.imageUrl}
                    discount={item.desconto || 0}
                    rating={item.rating || 0}
                    onPress={() =>
                      navigation.navigate("ProductDetail", { produto: item })
                    }
                    onAdd={() => console.log(`Adicionado: ${item.nome}`)}
                    style={styles.horizontalCard}
                  />
                ))}
              </ScrollView>
            </>
          )}

          {/* 📈 Mais Pesquisados */}
          {maisPesquisados.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>📈 Mais Pesquisados</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {maisPesquisados.map((item) => (
                  <CardItem
                    key={item.id}
                    title={item.nome}
                    description={item.descricao}
                    price={Number(item.preco)}
                    imageUrl={item.imageUrl}
                    discount={item.desconto || 0}
                    rating={item.rating || 0}
                    onPress={() =>
                      navigation.navigate("ProductDetail", { produto: item })
                    }
                    onAdd={() => console.log(`Adicionado: ${item.nome}`)}
                    style={styles.horizontalCard}
                  />
                ))}
              </ScrollView>
            </>
          )}
        </ScrollView>
      </View>

      {/* ⚙️ BottomBar */}
      <GlobalBottomBar currentRouteName="Search" navigate={navigation.navigate} />
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2" },
  content: { flex: 1, marginBottom: Platform.OS === "ios" ? 150 : 140 },
  header: {
    height: "19%",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    minHeight: 90,
    borderBottomEndRadius: 20,
    borderBottomStartRadius: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  input: { flex: 1, fontSize: 16, color: "#111", marginLeft: 8 },
  scrollContent: { flex: 1 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    color: "#111",
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    margin: 4,
  },
  categoryActive: { backgroundColor: "#c8e6c9" },
  categoryText: { marginLeft: 6, fontSize: 14, color: "#111" },
  horizontalList: { paddingHorizontal: 12 },
  horizontalCard: {
    width: 180,
    marginRight: 12,
  },
  noResults: {
    textAlign: "center",
    fontSize: 14,
    color: "#777",
    marginVertical: 20,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});