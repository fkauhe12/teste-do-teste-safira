// screens/AdminOrderDetail.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

function formatDate(ts) {
  if (!ts) return "—";
  try {
    if (ts.toDate) {
      return ts.toDate().toLocaleString("pt-BR");
    }
    if (typeof ts === "number") {
      return new Date(ts).toLocaleString("pt-BR");
    }
  } catch (e) {}
  return "—";
}

export default function AdminOrderDetail({ route, navigation }) {
  const { order } = route.params || {};

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          Pedido não encontrado.
        </Text>
      </View>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedido #{order.id}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informações Gerais</Text>
          <Text style={styles.line}>
            <Text style={styles.label}>Status: </Text>
            {order.status || "—"}
          </Text>
          <Text style={styles.line}>
            <Text style={styles.label}>Criado em: </Text>
            {formatDate(order.createdAt)}
          </Text>
          <Text style={styles.line}>
            <Text style={styles.label}>Atualizado em: </Text>
            {formatDate(order.updatedAt)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <Text style={styles.line}>
            <Text style={styles.label}>UID: </Text>
            {order.userId || "—"}
          </Text>
          <Text style={styles.line}>
            <Text style={styles.label}>Nome: </Text>
            {order.userName || "—"}
          </Text>
          <Text style={styles.line}>
            <Text style={styles.label}>E-mail: </Text>
            {order.userEmail || "—"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pagamento</Text>
          <Text style={styles.line}>
            <Text style={styles.label}>Forma: </Text>
            {order.pagamento || "—"}
          </Text>
          <Text style={styles.line}>
            <Text style={styles.label}>Subtotal: </Text>
            R$ {Number(order.subtotal || order.total || 0).toFixed(2)}
          </Text>
          {order.desconto ? (
            <Text style={styles.line}>
              <Text style={styles.label}>Desconto: </Text>
              R$ {Number(order.desconto || 0).toFixed(2)}
            </Text>
          ) : null}
          <Text style={styles.line}>
            <Text style={styles.label}>Total: </Text>
            R$ {Number(order.total || 0).toFixed(2)}
          </Text>
          {order.cupom ? (
            <Text style={styles.line}>
              <Text style={styles.label}>Cupom: </Text>
              {order.cupom}
            </Text>
          ) : null}
        </View>

        {items.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Itens</Text>
            {items.map((it, idx) => (
              <View key={`${it.id}-${idx}`} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{it.nome || it.name}</Text>
                  <Text style={styles.itemSub}>
                    ID: {it.id} • Qtde: {it.quantidade || 1}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  R$ {Number(it.preco || 0).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: "#fff",
    elevation: 2,
  },
  backBtn: { paddingRight: 10, paddingVertical: 6 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#333" },

  content: { padding: 12, paddingBottom: 40 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111",
  },
  line: { marginBottom: 4, color: "#444" },
  label: { fontWeight: "700" },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  itemName: { fontWeight: "600", color: "#222" },
  itemSub: { color: "#777", fontSize: 12 },
  itemPrice: { fontWeight: "600", color: "#222", marginLeft: 10 },
});