import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { firestoreDb, db, ref as dbRef, set as dbSet } from "../services/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { ref, get as rdbGet } from "firebase/database";
import { getAuth } from "firebase/auth";

export default function AdminPanel({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState({});
  const [driversList, setDriversList] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [allUsersList, setAllUsersList] = useState([]);
  const [loadUsersError, setLoadUsersError] = useState(null);

  // ===============================
  // ✅ VERIFICAR TOKEN E CLAIM ADMIN
  // ===============================
  useEffect(() => {
    const auth = getAuth();
    auth.currentUser?.getIdTokenResult(true).then(t => {
      console.log("TOKEN ATUAL →", t.claims);
      if (!t.claims.admin) {
        console.warn("O usuário NÃO tem o claim admin: true. Faça logout/login.");
      }
    });
  }, []);

  // ===============================
  // Carregar pedidos do Firestore
  // ===============================
  useEffect(() => {
    if (!firestoreDb) return;
    const coll = collection(firestoreDb, "deliveries");
    const unsub = onSnapshot(coll, async (snap) => {
      const arr = [];
      const missingUserIds = new Set();
      snap.forEach((d) => {
        const data = { id: d.id, ...d.data() };
        arr.push(data);
        if (data.userId && !users[data.userId]) missingUserIds.add(data.userId);
      });
      arr.sort((a,b)=> (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
      setOrders(arr);

      if (missingUserIds.size > 0 && db) {
        const updates = {};
        await Promise.all(Array.from(missingUserIds).map(async (uid) => {
          try {
            const snapU = await rdbGet(dbRef(db, `users/${uid}`));
            updates[uid] = snapU.exists() ? snapU.val() : { fullName: null, email: null };
          } catch (e) {
            updates[uid] = { fullName: null, email: null };
          }
        }));
        setUsers(prev => ({ ...prev, ...updates }));
      }
    });
    return () => unsub();
  }, []);

  // ===============================
  // Toggle roles
  // ===============================
  const toggleUserRole = async (uid, roleKey, current) => {
    try {
      await dbSet(dbRef(db, `users/${uid}/${roleKey}`), !current);
      setAllUsersList(prev => prev.map(u => u.uid === uid ? { ...u, [roleKey]: !current } : u));
      setUsers(prev => ({ ...prev, [uid]: { ...prev[uid], [roleKey]: !current } }));
      Alert.alert('OK', `${roleKey} atualizado para ${!current}`);
    } catch (e) {
      console.warn('toggleUserRole failed', e);
      Alert.alert('Erro', 'Não foi possível atualizar papel do usuário');
    }
  };

  // ===============================
  // Carregar todos usuários do RTDB (reutilizável, com tratamento de erro)
  // ===============================
  const loadAllUsers = async () => {
    setLoadUsersError(null);
    try {
      const snap = await rdbGet(dbRef(db, 'users'));
      if (!snap.exists()) return;
      const obj = snap.val();
      const arr = Object.keys(obj).map(uid => ({ uid, ...obj[uid] }));
      setAllUsersList(arr);
      setDriversList(arr.filter(u => u.isDriver));
      const map = {};
      arr.forEach(u => (map[u.uid] = u));
      setUsers(prev => ({ ...prev, ...map }));
    } catch (e) {
      console.warn('AdminPanel: loadAllUsers failed', e?.message);
      setLoadUsersError(e?.message || 'Erro ao carregar usuários');
    }
  };

  useEffect(() => { loadAllUsers(); }, []);

  // ===============================
  // Atualizar status do pedido
  // ===============================
  const setStatus = async (id, status) => {
    try {
      const docRef = doc(firestoreDb, "deliveries", id);
      await updateDoc(docRef, { status });
      Alert.alert("OK", `Status atualizado para ${status}`);
    } catch (e) {
      console.warn(e);
      Alert.alert("Erro", "Não foi possível atualizar status");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Painel Admin — Pedidos</Text>
      <ScrollView>
        {loadUsersError ? (
          <View style={{ padding: 12, backgroundColor: '#ffe6e6', borderRadius: 8, marginBottom: 10 }}>
            <Text style={{ fontWeight: '700', color: '#b00020' }}>Não foi possível carregar lista de usuários</Text>
            <Text style={{ marginTop: 6 }}>{loadUsersError}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity onPress={() => loadAllUsers()} style={[styles.smallBtn, { backgroundColor: '#425bab' }]}>
                <Text style={styles.btnText}>Tentar Novamente</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                  Alert.alert('Regras Recomendadas', `Adicione regras de leitura no nó /users para permitir leitura da lista por admins. Exemplo:

  "users": {
    ".read": "auth != null && auth.token.admin === true",
    ".write": "auth != null && auth.token.admin === true",
    "$uid": {
      ".read": "auth != null && (auth.uid === $uid || auth.token.admin === true)",
      ".write": "auth != null && (auth.uid === $uid || auth.token.admin === true)",
      ".validate": "newData.hasChildren(['fullName','email'])"
    }
  }
  `)
              }} style={[styles.smallBtn, { backgroundColor: '#6c757d', marginLeft: 8 }]}>
                <Text style={styles.btnText}>Mostrar Instruções</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        <Text style={{ fontSize: 16, fontWeight: '700', marginVertical: 8 }}>Gerenciar Usuários</Text>
        {allUsersList.map(u => (
          <View key={u.uid} style={[styles.card, { backgroundColor: '#f8f9fa' }]}>
            <Text style={{ fontWeight: '700' }}>{u.fullName ?? u.email ?? u.uid}</Text>
            <Text style={{ marginBottom: 6 }}>{u.email ?? '—'}</Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => toggleUserRole(u.uid, 'isAdmin', !!u.isAdmin)} style={[styles.smallBtn, { backgroundColor: u.isAdmin ? '#2ecc71' : '#6c757d' }]}>
                <Text style={styles.btnText}>{u.isAdmin ? 'Admin' : 'Dar Admin'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleUserRole(u.uid, 'isDriver', !!u.isDriver)} style={[styles.smallBtn, { backgroundColor: u.isDriver ? '#f39c12' : '#425bab' }]}>
                <Text style={styles.btnText}>{u.isDriver ? 'Entregador' : 'Dar Entregador'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  card: { padding: 12, borderRadius: 8, backgroundColor: "#fff", marginBottom: 10, elevation: 2 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginRight: 8 },
  btnText: { color: "#fff", fontWeight: "600" },
});
