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

    <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Categorias</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesRow}
    >
      {CATEGORIES.map((cat) => (
        <TouchableOpacity key={cat} style={styles.catChip} onPress={() => onSelectTerm(cat)}>
          <Ionicons name="medkit-outline" size={14} color="#1D4ED8" />
          <Text style={styles.catChipText}>{cat}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>

    <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Top do momento</Text>
  </View>
));

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const BAR_HEIGHT = Platform.OS === "ios" ? 70 : 68;

  const onSelectTerm = (term) => {
    setSelected(term);
    setQuery(term);
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buscar</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Barra de busca */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#9aa0a6" style={{ marginHorizontal: 8 }} />
        <TextInput
          style={styles.input}
          placeholder="Busque por medicamentos, dermocosméticos, higiene..."
          placeholderTextColor="#9aa0a6"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          blurOnSubmit={false}
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor="#1D4ED8"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")} style={{ paddingHorizontal: 8 }}>
            <Ionicons name="close-circle" size={18} color="#9aa0a6" />
          </TouchableOpacity>
        )}
      </View>

      {/* Lista principal */}
      <FlatList
        data={TOP_NOW}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<HeaderContent selected={selected} onSelectTerm={onSelectTerm} />}
        contentContainerStyle={{
          padding: 12,
          paddingBottom: (Platform.OS === "web" ? 80 : BAR_HEIGHT + 24),
        }}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        removeClippedSubviews={Platform.OS !== "web"}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => onSelectTerm(item.name)}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.rowIcon}>
                <Ionicons name="flame" size={16} color="#EF4444" />
              </View>
              <Text style={styles.rowText}>{item.name}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.searches} buscas</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#d9d9d9" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "ios" ? 40 : 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginRight: 6 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#111" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 10,
  },
  input: { flex: 1, color: "#111", fontSize: 16 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    marginHorizontal: 12,
    marginTop: 4,
  },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: 8, marginBottom: 4 },
  chip: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    margin: 4,
  },
  chipText: { color: "#111827", fontSize: 14 },
  chipActive: { backgroundColor: "#1D4ED8" },
  chipTextActive: { color: "#fff" },

  categoriesRow: { paddingHorizontal: 12, paddingBottom: 4 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E7FF",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  catChipText: { marginLeft: 6, color: "#1D4ED8", fontSize: 14, fontWeight: "600" },

  row: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 12,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    marginRight: 8,
  },
  rowText: { fontSize: 15, color: "#111827" },

  badge: { backgroundColor: "#EEF2FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { color: "#1D4ED8", fontSize: 12, fontWeight: "600" },
});