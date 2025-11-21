import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { firestoreDb, auth } from '../services/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';

export default function NotificationsScreen({ navigation }) {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !firestoreDb) return;
    const q = query(collection(firestoreDb, 'notifications'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      arr.sort((a,b)=> (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
      setNotes(arr);
    }, (err) => {
      console.warn('Notifications: snapshot err', err?.message);
      Alert.alert('Erro', 'Não foi possível carregar notificações');
    });
    return () => unsub();
  }, []);

  const markRead = async (n) => {
    try {
      const refDoc = doc(firestoreDb, 'notifications', n.id);
      await updateDoc(refDoc, { read: true });
    } catch (e) {
      console.warn('markRead failed', e?.message);
    }
  };

  const openNotification = async (n) => {
    await markRead(n);
    if (n.productId) navigation.navigate('ProductDetail', { produtoId: n.productId });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notificações</Text>
      <FlatList
        data={notes}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openNotification(item)} style={[styles.card, item.read ? styles.cardRead : styles.cardUnread]}>
            <View style={styles.cardInner}>
              <View style={styles.leftAccent} />
              <View style={styles.cardContent}>
                <View style={styles.rowTop}>
                  <Text style={styles.cardTitle}>{item.title ?? 'Atualização'}</Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.cardBody} numberOfLines={2}>{item.body ?? ''}</Text>
                <Text style={styles.cardTime}>{new Date((item.createdAt?.seconds||0)*1000).toLocaleString()}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#f2f2f2' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  card: { padding: 2, borderRadius: 14, backgroundColor: 'transparent', marginBottom: 12 },
  cardInner: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 2 },
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
    }),
  },
  leftAccent: { width: 6, backgroundColor: '#4873FF' },
  cardContent: { flex: 1, padding: 12 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: '700', fontSize: 15, color: '#222' },
  cardBody: { marginTop: 6, color: '#444', fontSize: 14 },
  cardTime: { marginTop: 8, color: '#888', fontSize: 12 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF4B4B' },
  cardUnread: { opacity: 1 },
  cardRead: { opacity: 0.7 },
});
