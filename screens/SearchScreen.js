import React, { useState, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlobalBottomBar from '../components/GlobalBottomBar';

const POPULAR_TERMS = [
  "Dipirona","Paracetamol","Ibuprofeno","Omeprazol","Loratadina",
  "Amoxicilina","Soro fisiológico","Vitamina C","Protetor solar",
  "Fralda infantil","Álcool 70%","Termômetro",
];

const CATEGORIES = [
  "Dor e Febre","Gripe e Resfriado","Alergia","Gastro",
  "Dermocosméticos","Higiene Oral","Infantil","Vitaminas","Curativos","Genéricos",
];

const TOP_NOW = [
  { id: "1", name: "Dipirona 500mg", searches: 1340 },
  { id: "2", name: "Paracetamol 750mg", searches: 1275 },
  { id: "3", name: "Ibuprofeno 400mg", searches: 1032 },
  { id: "4", name: "Omeprazol 20mg", searches: 980 },
  { id: "5", name: "Loratadina 10mg", searches: 812 },
  { id: "6", name: "Vitamina C 1g", searches: 740 },
  { id: "7", name: "Soro fisiológico 0,9%", searches: 705 },
];

const HeaderContent = memo(({ selected, onSelectTerm }) => (
  <View>
    <Text style={styles.sectionTitle}>
      <Ionicons name="flame" size={18} color="#EF4444" /> Mais pesquisados
    </Text>
    <View style={styles.chipsWrap}>
      {POPULAR_TERMS.map((term) => (
        <TouchableOpacity
          key={term}
          style={[styles.chip, selected === term && styles.chipActive]}
          onPress={() => onSelectTerm(term)}
        >
          <Text
            style={[
              styles.chipText,
              selected === term && styles.chipTextActive,
            ]}
          >
            {term}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Top do momento</Text>
  </View>
));

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const onSelectTerm = (term) => {
    setSelected(term);
    setQuery(term);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buscar</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#111" />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Digite aqui..."
            placeholderTextColor="#666"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={20} color="#111" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Conteúdo */}
        <ScrollView style={styles.scrollContent}>
          <HeaderContent selected={selected} onSelectTerm={onSelectTerm} />
          
          {/* TOP NOW Section */}
          {TOP_NOW.map((item) => (
            <TouchableOpacity key={item.id} style={styles.topItem}>
              <View style={styles.topItemLeft}>
                <Text style={styles.rank}>#{item.id}</Text>
                <Text style={styles.topItemName}>{item.name}</Text>
              </View>
              <Text style={styles.searches}>{item.searches} buscas</Text>
            </TouchableOpacity>
          ))}
          
          {/* Categories */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Categorias</Text>
          <View style={styles.categories}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity key={category} style={styles.categoryItem}>
                <Text style={styles.categoryText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      <GlobalBottomBar currentRouteName="Search" navigate={navigation.navigate} />
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d9d9d9"
  },
  content: {
    flex: 1,
    marginBottom: Platform.OS === "web" ? 70 : Platform.OS === "ios" ? 160 : 150
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#111"
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee"
  },
  input: {
    flex: 1,
    color: "#111",
    fontSize: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 16,
    marginBottom: 8,
    color: "#111"
  },
  scrollContent: {
    flex: 1
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 8,
    marginBottom: 4
  },
  chip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4
  },
  chipActive: {
    backgroundColor: "#3B82F6"
  },
  chipText: {
    color: "#4B5563",
    fontSize: 14
  },
  chipTextActive: {
    color: "#fff"
  },
  topItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8
  },
  topItemLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  rank: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3B82F6",
    marginRight: 8
  },
  topItemName: {
    fontSize: 14,
    color: "#111"
  },
  searches: {
    fontSize: 12,
    color: "#6B7280"
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12
  },
  categoryItem: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 4
  },
  categoryText: {
    color: "#111",
    fontSize: 14
  }
});