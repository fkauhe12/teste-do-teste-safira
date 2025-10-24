import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlobalBottomBar from "../components/GlobalBottomBar";
import { LinearGradient } from "expo-linear-gradient";


// Dados
import { categorias, produtos, maisPesquisados, topDoMomento } from "../data/produtos";

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Filtragem principal: busca + categoria
  const filteredProducts = produtos.filter((item) => {
    const matchesQuery = item.nome.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = selectedCategory
      ? item.categoria === selectedCategory
      : true;
    return matchesQuery && matchesCategory;
  });

    return (
    <View style={styles.container}>
      {/* Cabeçalho com gradiente */}
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

      {/* Conteúdo com rolagem */}
      <View style={styles.content}>
        <ScrollView style={styles.scrollContent}>
          {/* Categorias */}
          <Text style={styles.sectionTitle}>Categorias</Text>
          <View style={styles.categories}>
            {categorias.map((cat) => (
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
                <Ionicons name={cat.icone} size={18} color={cat.cor} />
                <Text style={styles.categoryText}>{cat.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Resultados */}
          {(query.length > 0 || selectedCategory) && (
            <>
              <Text style={styles.sectionTitle}>Resultados</Text>
              {filteredProducts.length === 0 ? (
                <Text style={styles.noResults}>Nenhum produto encontrado.</Text>
              ) : (
                <View style={styles.productGrid}>
                  {filteredProducts.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.productCard}>
                      <Image source={{ uri: item.imageUrl }} style={styles.image} />
                      <Text style={styles.productName}>{item.nome}</Text>
                      <Text style={styles.productDesc}>{item.descricao}</Text>
                      <Text style={styles.price}>R$ {item.preco.toFixed(2)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Mais pesquisados / Top do momento */}
          {!query && !selectedCategory && (
            <>
              <Text style={styles.sectionTitle}>Mais pesquisados</Text>
              <View style={styles.productGrid}>
                {maisPesquisados.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.productCard}>
                    <Image source={{ uri: item.imageUrl }} style={styles.image} />
                    <Text style={styles.productName}>{item.nome}</Text>
                    <Text style={styles.productDesc}>{item.descricao}</Text>
                    <Text style={styles.price}>R$ {item.preco.toFixed(2)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Top do momento</Text>
              <View style={styles.productGrid}>
                {topDoMomento.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.productCard}>
                    <Image source={{ uri: item.imageUrl }} style={styles.image} />
                    <Text style={styles.productName}>{item.nome}</Text>
                    <Text style={styles.productDesc}>{item.descricao}</Text>
                    <Text style={styles.price}>R$ {item.preco.toFixed(2)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>

      <GlobalBottomBar currentRouteName="Search" navigate={navigation.navigate} />
    </View>
  );

};

export default SearchScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2" },
  content: { flex: 1, marginBottom: Platform.OS === "ios" ? 150 : 120 },
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
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: "#111", 
    marginLeft: 8,
  },
  
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
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    padding: 8,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    resizeMode: "contain",
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
    color: "#111",
  },
  productDesc: { fontSize: 12, color: "#555" },
  price: { fontSize: 14, fontWeight: "700", color: "#2e7d32", marginTop: 4 },
  noResults: { textAlign: "center", fontSize: 14, color: "#777", marginVertical: 20 },
});
