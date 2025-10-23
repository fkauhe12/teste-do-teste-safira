import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { product } = route.params || {};
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  if (!product) {
    return (
      <SafeAreaView style={styles.empty}>
        <Text>Produto não encontrado.</Text>
      </SafeAreaView>
    );
  }

  const price = typeof product.preco === 'number' ? product.preco : 0;

  function onConfirm() {
    addItem(product, quantity);
    navigation.navigate('Cart');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <Image source={typeof product.imageUrl === 'string' ? { uri: product.imageUrl } : product.imageUrl}
               style={styles.image} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{product.nome}</Text>
        <Text style={styles.desc}>{product.descricao}</Text>

        <View style={styles.row}>
          <Text style={styles.price}>R$ {price.toFixed(2)}</Text>

          <View style={styles.qtyBox}>
            <TouchableOpacity onPress={() => setQuantity(q => Math.max(1, q - 1))} style={styles.qtyBtn}>
              <Text style={styles.qtyText}>-</Text>
            </TouchableOpacity>

            <Text style={styles.qtyNumber}>{quantity}</Text>

            <TouchableOpacity onPress={() => setQuantity(q => q + 1)} style={styles.qtyBtn}>
              <Text style={styles.qtyText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} activeOpacity={0.8}>
          <Text style={styles.confirmText}>Adicionar à sacola</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  top: { height: 300, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  image: { width: '80%', height: '80%', resizeMode: 'contain', borderRadius: 12 },
  body: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  desc: { color: '#666', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  price: { fontSize: 20, fontWeight: '800', color: '#1976D2' },
  qtyBox: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 20, fontWeight: '700' },
  qtyNumber: { marginHorizontal: 12, fontSize: 16, fontWeight: '600' },
  confirmBtn: { backgroundColor: '#1976D2', padding: 14, borderRadius: 10, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
