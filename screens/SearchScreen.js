// screens/SearchScreen.js
import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { useCart } from "../context/CartContext";

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();

  // Carrega produtos e monta categorias automáticas
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const produtosSnap = await getDocs(collection(firestoreDb, "produtos"));
        if (!mounted) return;

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
        console.error("Erro ao carregar dados:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  // Filtro por texto e categoria
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return produtos.filter((item) => {
      const matchesQuery = q
        ? item.nome?.toLowerCase().includes(q) || false
        : true;
      const matchesCategory = selectedCategory
        ? item.categoria === selectedCategory
        : true;
      return matchesQuery && matchesCategory;
    });
  }, [produtos, query, selectedCategory]);

  // Listas especiais
  const topDoMomento = useMemo(
    () => produtos.filter((p) => p.topDoMomento),
    [produtos]
  );
  const maisPesquisados = useMemo(
    () => produtos.filter((p) => p.maisPesquisado),
    [produtos]
  );

  const handleToggleCategory = useCallback((nome) => {
    setSelectedCategory((prev) => (prev === nome ? null : nome));
  }, []);

  const handleAddProduct = useCallback(
    (item) => {
      addToCart({
        id: item.id,
        nome: item.nome,
        preco: Number(item.preco),
        imageUrl: item.imageUrl,
      });
    },
    [addToCart]
  );

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
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

      {/* Conteúdo */}
      <View style={styles.content}>
        {loading ? (
          // Mostra carregando dentro da área principal sem tela em branco
          <View style={styles.inlineLoading}>
            <ActivityIndicator size="large" color="#0E2E98" />
            <Text style={{ marginTop: 8 }}>Carregando produtos...</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Categorias */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Categorias</Text>
              {categorias.length > 0 && (
                <Text style={styles.sectionSubtitle}>
                  Toque para filtrar por categoria
                </Text>
              )}
            </View>

            <View style={styles.categories}>
              {categorias.length === 0 ? (
                <Text style={styles.categoriesEmptyText}>
                  Nenhuma categoria encontrada.
                </Text>
              ) : (
                categorias.map((cat) => {
                  const isActive = selectedCategory === cat.nome;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryItem,
                        isActive && styles.categoryActive,
                      ]}
                      onPress={() => handleToggleCategory(cat.nome)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={cat.icone || "pricetag-outline"}
                        size={18}
                        color={isActive ? "#0E2E98" : cat.cor || "#444"}
                      />
                      <Text
                        style={[
                          styles.categoryText,
                          isActive && styles.categoryTextActive,
                        ]}
                      >
                        {cat.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Produtos filtrados */}
            <Text style={styles.sectionTitle}>
              {selectedCategory ? selectedCategory : "Produtos"}
            </Text>
            {filteredProducts.length === 0 ? (
              <Text style={styles.noResults}>
                Nenhum produto encontrado para essa busca.
              </Text>
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
                    onAdd={() => handleAddProduct(item)}
                    style={styles.horizontalCard}
                  />
                ))}
              </ScrollView>
            )}

            {/* Top do momento */}
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
                        navigation.navigate("ProductDetail", {
                          produto: item,
                        })
                      }
                      onAdd={() => handleAddProduct(item)}
                      style={styles.horizontalCard}
                    />
                  ))}
                </ScrollView>
              </>
            )}

            {/* Mais Pesquisados */}
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
                        navigation.navigate("ProductDetail", {
                          produto: item,
                        })
                      }
                      onAdd={() => handleAddProduct(item)}
                      style={styles.horizontalCard}
                    />
                  ))}
                </ScrollView>
              </>
            )}
          </ScrollView>
        )}
      </View>

      {/* BottomBar */}
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

  inlineLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  scrollContent: { flex: 1 },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    color: "#111",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 10,
  },

  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  categoriesEmptyText: {
    marginLeft: 16,
    color: "#777",
    marginBottom: 8,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  categoryActive: {
    backgroundColor: "#e3f2fd",
    borderColor: "#0E2E98",
  },
  categoryText: { marginLeft: 6, fontSize: 14, color: "#111" },
  categoryTextActive: {
    color: "#0E2E98",
    fontWeight: "600",
  },

  horizontalList: { paddingHorizontal: 12, paddingBottom: 4 },
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
});