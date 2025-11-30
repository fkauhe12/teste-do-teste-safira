// screens/MyOrdersScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { firestoreDb, auth } from "../services/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const STATUS_LABELS = {
  pending: "Aguardando",
  preparing: "Em preparo",
  enroute: "A caminho",
  shipped: "Enviado",
  delivered: "Entregue",
  received: "Recebido",
  cancelled: "Cancelado",
};

const STATUS_COLORS = {
  pending: "#f59e0b",
  preparing: "#6366f1",
  enroute: "#0ea5e9",
  shipped: "#0ea5e9",
  delivered: "#22c55e",
  received: "#16a34a",
  cancelled: "#ef4444",
};

function formatDate(ts) {
  if (!ts) return "-";
  try {
    if (ts.toDate) {
      return ts.toDate().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleString("pt-BR");
    }
    if (typeof ts === "number") {
      return new Date(ts).toLocaleString("pt-BR");
    }
  } catch (e) {}
  return "-";
}

export default function MyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !firestoreDb) return;

    const q = query(
      collection(firestoreDb, "deliveries"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        arr.sort(
          (a, b) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        setOrders(arr);
      },
      (err) => {
        console.warn("MyOrders: snapshot err", err?.message);
        Alert.alert("Erro", "Não foi possível carregar seus pedidos");
      }
    );

    return () => unsub();
  }, []);

  const renderItem = ({ item }) => {
    const statusLabel = STATUS_LABELS[item.status] || item.status || "—";
    const statusColor = STATUS_COLORS[item.status] || "#6b7280";
    const createdAt = formatDate(item.createdAt);
    const items = Array.isArray(item.items) ? item.items : [];
    const firstItem = items[0];
    const totalQty = items.reduce(
      (sum, it) => sum + (it.quantidade || 0),
      0
    );

    const titleProduto =
      firstItem?.nome || firstItem?.name || firstItem?.titulo || null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>Pedido #{item.id}</Text>
            <Text style={styles.orderDate}>{createdAt}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        <View style={{ marginTop: 8 }}>
          {titleProduto ? (
            <Text style={styles.itemsText} numberOfLines={1}>
              {titleProduto}
              {totalQty > 1
                ? `  •  +${totalQty - 1} item(ns)`
                : ""}
            </Text>
          ) : (
            <Text style={styles.itemsText}>Itens do pedido</Text>
          )}
        </View>

        <View style={styles.rowBottom}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              R$ {Number(item.total || 0).toFixed(2)}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.payLabel}>Pagamento</Text>
            <Text style={styles.payValue}>
              {item.pagamento || "Não informado"}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("EntregaStatus", {
                orderId: item.id,
                order: item,
              })
            }
            style={styles.btnPrimary}
          >
            <Text style={styles.btnPrimaryText}>Ver detalhes / entrega</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Pedidos</Text>
      <FlatList
        data={orders}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={
          orders.length === 0 && { flex: 1, justifyContent: "center" }
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Você ainda não realizou nenhum pedido.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f2f2f2",
    marginTop: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
  },
  card: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontWeight: "700",
    fontSize: 15,
    color: "#111827",
  },
  orderDate: {
    marginTop: 2,
    fontSize: 12,
    color: "#6b7280",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  itemsText: {
    fontSize: 14,
    color: "#374151",
  },
  rowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  payLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  payValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  btnPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#425bab",
    borderRadius: 6,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});