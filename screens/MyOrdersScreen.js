import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { firestoreDb, auth } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function MyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !firestoreDb) return;
    const q = query(collection(firestoreDb, 'deliveries'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      arr.sort((a,b)=> (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
      setOrders(arr);
    }, (err) => {
      console.warn('MyOrders: snapshot err', err?.message);
      Alert.alert('Erro', 'Não foi possível carregar seus pedidos');
    });

    return () => unsub();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Pedidos</Text>
      <FlatList
        data={orders}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={{ fontWeight: '700' }}>{item.id}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Total: R$ {item.total?.toFixed?.(2) ?? '-'}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity onPress={() => navigation.navigate('EntregaStatus', { orderId: item.id, order: item })} style={styles.btn}>
                <Text style={styles.btnText}>Ver Entrega</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#f2f2f2' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  card: { padding: 12, borderRadius: 8, backgroundColor: '#fff', marginBottom: 10 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#425bab', borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: '700' },
});
