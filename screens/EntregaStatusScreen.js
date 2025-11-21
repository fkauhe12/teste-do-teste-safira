import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { firestoreDb, auth } from "../services/firebase";
import { doc, onSnapshot, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function EntregaStatusScreen({ navigation, route }) {
  const [progresso, setProgresso] = useState(0);
  const { orderId, order } = route?.params || {};
  const [remoteStatus, setRemoteStatus] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [orderObj, setOrderObj] = useState(order || null);

  useEffect(() => {
    // Se houver um orderId, subscreve o documento no Firestore
    let unsub = null;
      if (orderId && firestoreDb) {
      try {
        const docRef = doc(firestoreDb, "deliveries", orderId);
        unsub = onSnapshot(docRef, (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          setOrderObj({ id: snap.id, ...data });
          setRemoteStatus(data.status || null);
          if (data.driver && data.driver.location) {
            setDriverLocation(data.driver.location);
          }
        });
      } catch (e) {
        console.warn("EntregaStatus: onSnapshot failed", e?.message);
      }
    }

    // animação local de progresso enquanto espera updates
    const interval = setInterval(() => {
      setProgresso((prev) => (prev >= 1 ? 1 : prev + 0.02));
    }, 200);

    return () => {
      clearInterval(interval);
      if (unsub) unsub();
    };
  }, []);

  const confirmarRecebimento = () => {
    try {
      const user = auth.currentUser;
      if (!user) return Alert.alert('Login necessário', 'Faça login para confirmar o recebimento');
      if (!orderObj || !orderObj.id) return Alert.alert('Erro', 'Pedido não encontrado');
      if (orderObj.userId !== user.uid) return Alert.alert('Sem permissão', 'Apenas o comprador pode confirmar o recebimento.');
      // somente confirma se o status remoto estiver como delivered
      if (remoteStatus && remoteStatus !== 'delivered') {
        return Alert.alert('Aguardando entrega', 'O pedido ainda não está marcado como entregue pelo entregador');
      }
      const docRef = doc(firestoreDb, 'deliveries', orderObj.id);
      updateDoc(docRef, { status: 'received', receivedAt: serverTimestamp() });
      Alert.alert('Confirmado', 'Recebimento confirmado. Obrigado!');
    } catch (e) {
      console.warn('confirmarRecebimento error', e?.message);
      Alert.alert('Erro', 'Não foi possível confirmar o recebimento');
    }
  };

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

      <View style={styles.content}>
        <Text style={styles.title}>Status da Entrega</Text>

        <Image
          source={{ uri: "https://img.icons8.com/ios-filled/100/000000/motorcycle.png" }}
          style={{ width: 120, height: 120, marginBottom: 25 }}
        />

        <View style={styles.progressContainer}>
          <View style={[styles.progressFill, { width: `${progresso * 100}%` }]} />
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusText}>
            {orderId ? `Pedido: ${orderId}` : "Aguardando confirmação do pedido..."}
          </Text>

          <Text style={[styles.statusText, { marginTop: 8, fontSize: 16 }]}> 
            {remoteStatus
              ? `Status: ${remoteStatus}`
              : progresso < 0.3
              ? "Preparando pedido"
              : progresso < 0.7
              ? "Entregador a caminho"
              : "Quase chegando"}
          </Text>

          {driverLocation && (
            <Text style={{ textAlign: "center", marginTop: 8 }}>
              Entregador: {driverLocation.lat?.toFixed(5)}, {driverLocation.lng?.toFixed(5)}
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={confirmarRecebimento}>
          <LinearGradient
            colors={["#718fff", "#425bab"]}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.btnConfirmar}
          >
            <Text style={styles.txtConfirmar}>Confirmar Recebimento</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
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
    marginBottom: 35,
  },

  statusText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#444",
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
