import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { firestoreDb, auth } from "../services/firebase";
import {
  doc,
  onSnapshot,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

// Mapeia status -> texto amigável
const STATUS_LABELS = {
  pending: "Pedido recebido",
  preparing: "Preparando pedido",
  on_the_way: "Entregador a caminho",
  delivered: "Entregue",
  received: "Recebimento confirmado",
};

// Mapeia status -> porcentagem de progresso
const STATUS_PROGRESS = {
  pending: 0.15,
  preparing: 0.35,
  on_the_way: 0.7,
  delivered: 0.95,
  received: 1,
};

// Formata Timestamp do Firestore
function formatDateTime(ts) {
  if (!ts || !ts.toDate) return "-";
  const d = ts.toDate();
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EntregaStatusScreen({ navigation, route }) {
  const { orderId, order: orderFromRoute } = route?.params || {};

  const [orderObj, setOrderObj] = useState(orderFromRoute || null);
  const [remoteStatus, setRemoteStatus] = useState(orderFromRoute?.status || null);
  const [progresso, setProgresso] = useState(
    STATUS_PROGRESS[orderFromRoute?.status] ?? 0.1
  );
  const [driverLocation, setDriverLocation] = useState(
    orderFromRoute?.driver?.location || null
  );

  useEffect(() => {
    let unsub = null;

    async function loadOnce(id) {
      try {
        const snap = await getDoc(doc(firestoreDb, "deliveries", id));
        if (!snap.exists()) return;
        const data = snap.data();
        setOrderObj({ id: snap.id, ...data });
        setRemoteStatus(data.status || null);
        if (data.driver?.location) {
          setDriverLocation(data.driver.location);
        }
      } catch (e) {
        console.warn("Erro ao buscar pedido:", e?.message);
      }
    }

    if (orderId && firestoreDb) {
      const ref = doc(firestoreDb, "deliveries", orderId);
      unsub = onSnapshot(
        ref,
        (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          setOrderObj({ id: snap.id, ...data });
          setRemoteStatus(data.status || null);
          if (data.driver?.location) {
            setDriverLocation(data.driver.location);
          }
        },
        (error) => {
          console.warn("EntregaStatus onSnapshot error:", error?.message);
        }
      );
    } else if (orderFromRoute?.id) {
      // Caso a tela receba o objeto inteiro pela navegação
      setOrderObj(orderFromRoute);
      setRemoteStatus(orderFromRoute.status || null);
    } else if (orderId) {
      // fallback caso não tenha firestoreDb no momento do mount
      loadOnce(orderId);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [orderId]);

  // Sempre que o status muda no Firebase, atualiza o progresso
  useEffect(() => {
    if (!remoteStatus) return;
    const p = STATUS_PROGRESS[remoteStatus] ?? 0.1;
    setProgresso(p);
  }, [remoteStatus]);

  const confirmarRecebimento = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return Alert.alert(
          "Login necessário",
          "Faça login para confirmar o recebimento"
        );
      }

      if (!orderObj?.id) {
        return Alert.alert("Erro", "Pedido não encontrado");
      }

      // Se você salva userId no pedido, garante que só o dono confirme
      if (orderObj.userId && orderObj.userId !== user.uid) {
        return Alert.alert(
          "Sem permissão",
          "Apenas o comprador pode confirmar o recebimento."
        );
      }

      // Só permite confirmar se já estiver marcado como entregue
      if (remoteStatus !== "delivered") {
        return Alert.alert(
          "Aguardando entrega",
          "O pedido ainda não está marcado como entregue pelo entregador."
        );
      }

      const ref = doc(firestoreDb, "deliveries", orderObj.id);
      await updateDoc(ref, {
        status: "received",
        receivedAt: serverTimestamp(),
      });

      Alert.alert("Confirmado", "Recebimento confirmado. Obrigado!");
    } catch (e) {
      console.warn("confirmarRecebimento error", e?.message);
      Alert.alert("Erro", "Não foi possível confirmar o recebimento");
    }
  };

  const statusLabel =
    STATUS_LABELS[remoteStatus] || "Aguardando atualização do pedido";

  const isReceived = remoteStatus === "received";

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#718fff", "#425bab"]}
        start={[0, 0]}
        end={[1, 0]}
        style={styles.topBarGradient}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back-sharp"
              size={26}
              color="rgba(255,255,255,0.9)"
            />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Status da Entrega</Text>

        <Image
          source={{
            uri: "https://img.icons8.com/ios-filled/100/000000/motorcycle.png",
          }}
          style={{ width: 120, height: 120, marginBottom: 25 }}
        />

        {/* Barra de progresso baseada no status do Firebase */}
        <View style={styles.progressContainer}>
          <View
            style={[styles.progressFill, { width: `${progresso * 100}%` }]}
          />
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusText}>
            {orderObj?.id
              ? `Pedido: ${orderObj.id}`
              : "Aguardando confirmação do pedido..."}
          </Text>

          <Text style={[styles.statusText, { marginTop: 8, fontSize: 16 }]}>
            {statusLabel}
          </Text>

          {orderObj?.createdAt && (
            <Text style={styles.statusSubText}>
              Realizado em: {formatDateTime(orderObj.createdAt)}
            </Text>
          )}

          {orderObj?.deliveredAt && (
            <Text style={styles.statusSubText}>
              Entregue em: {formatDateTime(orderObj.deliveredAt)}
            </Text>
          )}

          {orderObj?.receivedAt && (
            <Text style={styles.statusSubText}>
              Recebimento confirmado em: {formatDateTime(orderObj.receivedAt)}
            </Text>
          )}

          {driverLocation && (
            <Text style={[styles.statusSubText, { marginTop: 8 }]}>
              Local aproximado do entregador:{" "}
              {driverLocation.lat?.toFixed(5)}, {driverLocation.lng?.toFixed(5)}
            </Text>
          )}
        </View>

        {/* Resumo profissional do pedido */}
        {orderObj && (
          <View style={styles.orderInfoBox}>
            <Text style={styles.orderInfoTitle}>Resumo do Pedido</Text>

            <Text style={styles.orderInfoText}>
              Pagamento: {orderObj.pagamento || "-"}
            </Text>

            <Text style={styles.orderInfoText}>
              Subtotal: R${" "}
              {Number(orderObj.subtotal ?? orderObj.total ?? 0).toFixed(2)}
            </Text>

            {orderObj.desconto ? (
              <Text style={styles.orderInfoText}>
                Desconto: - R${" "}
                {Number(orderObj.desconto || 0).toFixed(2)}
              </Text>
            ) : null}

            <Text style={[styles.orderInfoText, { fontWeight: "700" }]}>
              Total: R$ {Number(orderObj.total || 0).toFixed(2)}
            </Text>

            {orderObj.cupom ? (
              <Text style={styles.orderInfoText}>
                Cupom aplicado: {orderObj.cupom}
              </Text>
            ) : null}

            {Array.isArray(orderObj.items) && orderObj.items.length > 0 && (
              <View style={styles.itemsList}>
                {orderObj.items.map((item, index) => (
                  <View
                    key={`${item.id}-${index}`}
                    style={styles.itemRow}
                  >
                    <Text style={styles.itemName}>{item.nome}</Text>
                    <Text style={styles.itemQtyPrice}>
                      {item.quantidade}x R${" "}
                      {Number(item.preco || 0).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          onPress={confirmarRecebimento}
          disabled={isReceived}
        >
          <LinearGradient
            colors={["#718fff", "#425bab"]}
            start={[0, 0]}
            end={[1, 0]}
            style={[
              styles.btnConfirmar,
              isReceived && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.txtConfirmar}>
              {isReceived
                ? "Recebimento já confirmado"
                : "Confirmar Recebimento"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  topBarGradient: { paddingVertical: 12, width: "100%" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  backButton: { flexDirection: "row", alignItems: "center" },

  backButtonText: {
    color: "white",
    marginLeft: 6,
    fontSize: 18,
    fontWeight: "bold",
  },

  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#333",
  },

  progressContainer: {
    width: "85%",
    height: 16,
    backgroundColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 25,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#425bab",
  },

  statusBox: {
    width: "100%",
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f5f5f5",
    marginBottom: 25,
  },

  statusText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#444",
  },

  statusSubText: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },

  orderInfoBox: {
    width: "100%",
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
    marginBottom: 30,
  },

  orderInfoTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#333",
  },

  orderInfoText: {
    fontSize: 15,
    color: "#444",
    marginBottom: 4,
  },

  itemsList: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 8,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  itemName: {
    fontSize: 14,
    color: "#444",
    flex: 1,
    marginRight: 8,
  },

  itemQtyPrice: {
    fontSize: 14,
    color: "#444",
    textAlign: "right",
  },

  btnConfirmar: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    width: 230,
  },

  txtConfirmar: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },
});