import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  db,
  firestoreDb,
  ref as dbRef,
  set as dbSet,
  get as rdbGet,
} from "../services/firebase"; // adapte se sua exportação for diferente
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/*
  AdminPanel:
  - Lista usuários do RTDB /users
  - Permite dar/remover isAdmin e isDriver (escreve no RTDB)
  - Opcional: se CLAIM_SERVER_URL estiver disponível, também faz POST para setar custom claims via Admin SDK externo
  - Lista pedidos do Firestore (collection "deliveries") e permite atualizar status
*/

const CLAIM_SERVER_URL = undefined; 
// se você tiver um servidor (ex.: http://MEU_IP:3001/set-claim) coloque a URL aqui.
// Ex: const CLAIM_SERVER_URL = "http://192.168.0.5:3001/set-claim";

export default function AdminPanel({ navigation }) {
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    loadUsers();
    const coll = collection(firestoreDb, "deliveries");
    const unsub = onSnapshot(coll, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      if (mounted.current) {
        setOrders(arr);
        setLoadingOrders(false);
      }
    }, (err) => {
      console.warn("deliveries snapshot error", err);
      setLoadingOrders(false);
    });

    return () => {
      mounted.current = false;
      unsub();
    };
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const snap = await rdbGet(dbRef(db, "users"));
      if (!snap.exists()) {
        setUsers([]);
        setLoadingUsers(false);
        return;
      }
      const obj = snap.val();
      const arr = Object.keys(obj).map((uid) => ({ uid, ...obj[uid] }));
      // normalize booleans (avoid undefined)
      arr.forEach(u => {
        u.isAdmin = !!u.isAdmin;
        u.isDriver = !!u.isDriver;
      });
      setUsers(arr);
    } catch (e) {
      console.warn("loadUsers error", e);
      Alert.alert("Erro", "Não foi possível carregar usuários.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([loadUsers()]);
    setRefreshing(false);
  };

  // atualiza RTDB e (opcional) chama claim server para também setar custom claim
  const updateRole = async (uid, roleKey, newValue, email = null) => {
    // roleKey: 'isAdmin' or 'isDriver'
    try {
      // 1) atualiza RTDB
      await dbSet(dbRef(db, `users/${uid}/${roleKey}`), newValue);

      // 2) atualiza estado local imediatamente
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, [roleKey]: newValue } : u));

      // 3) opcional: chamar claim server (se configurado) para setar custom claim admin/driver
      //    note: custom claim names we use: 'admin' and 'driver' (lowercase)
      if (CLAIM_SERVER_URL && roleKey === "isAdmin") {
        // only sync admin claim to auth token if server available
        try {
          await fetch(CLAIM_SERVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid,
              adminClaim: newValue,    // server must map this to admin claim
            }),
          });
        } catch (err) {
          console.warn("Claim server error (ignored):", err?.message || err);
        }
      }

      if (CLAIM_SERVER_URL && roleKey === "isDriver") {
        try {
          await fetch(CLAIM_SERVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid,
              driverClaim: newValue,
            }),
          });
        } catch (err) {
          console.warn("Claim server error (ignored):", err?.message || err);
        }
      }

      Alert.alert("Sucesso", `${roleKey === "isAdmin" ? "Admin" : "Entregador"} atualizado.`);
    } catch (e) {
      console.warn("updateRole error", e);
      Alert.alert("Erro", "Falha ao atualizar papel do usuário.");
      // reload users to reconcile state
      loadUsers();
    }
  };

  const toggleRole = (u, roleKey) => {
    const newValue = !u[roleKey];
    // Confirm for admin (optional)
    if (roleKey === "isAdmin") {
      Alert.alert(
        newValue ? "Dar Admin" : "Remover Admin",
        `Deseja ${newValue ? "dar" : "remover"} permissão de ADMIN para ${u.fullName ?? u.email ?? u.uid}?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Confirmar", onPress: () => updateRole(u.uid, roleKey, newValue, u.email) },
        ]
      );
    } else {
      updateRole(u.uid, roleKey, newValue, u.email);
    }
  };

  const setOrderStatus = async (orderId, status) => {
    try {
      const docRef = doc(firestoreDb, "deliveries", orderId);
      await updateDoc(docRef, { status });
      Alert.alert("OK", `Status do pedido ${orderId} atualizado para ${status}`);
    } catch (e) {
      console.warn("setOrderStatus error", e);
      Alert.alert("Erro", "Não foi possível atualizar status do pedido.");
    }
  };

  // small helper to check if current user is allowed to see this screen (checks RTDB flag)
  const checkLocalAdmin = async () => {
    try {
      const auth = getAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) return false;
      const snap = await rdbGet(dbRef(db, `users/${uid}/isAdmin`));
      return snap.exists() && snap.val() === true;
    } catch (e) {
      return false;
    }
  };

  // UI
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Painel Admin</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={refreshAll} disabled={refreshing}>
          {refreshing ? <ActivityIndicator color="#fff" /> : <Text style={styles.refreshText}>Atualizar</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 60 }}>
        <Text style={styles.sectionTitle}>Usuários</Text>

        {loadingUsers ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : users.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum usuário cadastrado.</Text>
        ) : (
          users.map((u) => (
            <View key={u.uid} style={styles.userCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{u.fullName ?? u.email ?? u.uid}</Text>
                {u.email ? <Text style={styles.userEmail}>{u.email}</Text> : null}
              </View>

              <View style={styles.userActions}>
                <TouchableOpacity
                  onPress={() => toggleRole(u, "isAdmin")}
                  style={[styles.smallBtn, u.isAdmin ? styles.btnAdminOn : styles.btnAdminOff]}
                >
                  <Text style={styles.smallBtnText}>{u.isAdmin ? "Admin" : "Dar Admin"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => toggleRole(u, "isDriver")}
                  style={[styles.smallBtn, u.isDriver ? styles.btnDriverOn : styles.btnDriverOff]}
                >
                  <Text style={styles.smallBtnText}>{u.isDriver ? "Entregador" : "Dar Entregador"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={styles.sectionDivider} />

        <Text style={styles.sectionTitle}>Pedidos</Text>

        {loadingOrders ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : orders.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum pedido encontrado.</Text>
        ) : (
          orders.map((o) => (
            <View key={o.id} style={styles.orderCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.orderTitle}>Pedido #{o.id}</Text>
                <Text style={styles.orderStatus}>{o.status || "—"}</Text>
              </View>
              <Text style={styles.orderLine}>Cliente: {o.userName ?? o.userId ?? "—"}</Text>
              <Text style={styles.orderLine}>Total: {o.total ?? "—"}</Text>

              <View style={styles.orderActions}>
                <TouchableOpacity style={styles.orderBtn} onPress={() => setOrderStatus(o.id, "preparing")}>
                  <Text style={styles.orderBtnText}>Em preparo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.orderBtn} onPress={() => setOrderStatus(o.id, "shipped")}>
                  <Text style={styles.orderBtnText}>Enviado</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.orderBtn} onPress={() => setOrderStatus(o.id, "delivered")}>
                  <Text style={styles.orderBtnText}>Entregue</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// =========================
// Styles
// =========================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fb", padding: 14, marginTop: Platform.OS === "ios" ? 50 : 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 20, fontWeight: "700", color: "#17202a" },
  refreshBtn: { backgroundColor: "#2d9cdb", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  refreshText: { color: "#fff", fontWeight: "700" },

  scroll: { marginTop: 10 },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: "#17202a" },
  emptyText: { color: "#7f8c8d", marginBottom: 8 },

  userCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  userName: { fontWeight: "700", fontSize: 15, color: "#1f2937" },
  userEmail: { color: "#7f8c8d", marginTop: 2 },

  userActions: { flexDirection: "row", marginLeft: 12 },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, marginLeft: 8 },
  smallBtnText: { color: "#fff", fontWeight: "700" },

  btnAdminOn: { backgroundColor: "#16a34a" },
  btnAdminOff: { backgroundColor: "#273043" },
  btnDriverOn: { backgroundColor: "#f59e0b" },
  btnDriverOff: { backgroundColor: "#2b6cb0" },

  sectionDivider: { height: 1, backgroundColor: "#e6e9ef", marginVertical: 12 },

  orderCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  orderTitle: { fontWeight: "700", fontSize: 15 },
  orderStatus: { fontStyle: "italic", color: "#57606f" },
  orderLine: { marginTop: 6, color: "#333" },

  orderActions: { flexDirection: "row", marginTop: 8, justifyContent: "space-between" },
  orderBtn: { flex: 1, paddingVertical: 8, marginRight: 8, borderRadius: 8, backgroundColor: "#2d9cdb", alignItems: "center" },
  orderBtnText: { color: "#fff", fontWeight: "700" },
});
