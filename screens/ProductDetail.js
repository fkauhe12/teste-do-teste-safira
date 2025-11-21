import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// IMPORTANTE → usar o contexto do carrinho
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // PEGAR A FUNÇÃO addToCart DO CONTEXTO
  const { addToCart } = useCart();

  const { produto } = route.params || {};

  const [quantity, setQuantity] = useState(1);
  const [loadingImg, setLoadingImg] = useState(true);
  const [imgError, setImgError] = useState(false);
  const placeholder = require("../assets/icons/icon_car_vazio.png");

  if (!produto) {
    return (
      <SafeAreaView style={styles.empty}>
        <Text>Produto não encontrado.</Text>
      </SafeAreaView>
    );
  }

  // Corrigir URL Firebase
  let rawUrl =
    produto.imageUrl ||
    produto.image ||
    produto.img ||
    produto.foto ||
    produto.url ||
    null;

  if (rawUrl && rawUrl.includes("&token=")) {
    // já tem token
  } else if (rawUrl && !rawUrl.includes("alt=media")) {
    rawUrl = rawUrl + "?alt=media";
  }

  const imageUrl = rawUrl || "https://via.placeholder.com/500?text=Sem+Imagem";

  const price = typeof produto.preco === "number" ? produto.preco : 0;

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // BOTÃO ADICIONAR À SACOLA REALMENTE ADICIONA AO CARRINHO
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  function onConfirm() {
    const produtoComQuantidade = { ...produto, quantidade: quantity };

    addToCart(produtoComQuantidade); // <<< ADICIONA AO CONTEXTO

    navigation.navigate("Cart"); // <<< VAI PARA A SACOLA
  }

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Botão de voltar */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 6 }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={28} color="#000" />
      </TouchableOpacity>

      {/* Conteúdo */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ paddingBottom: 200 }}
      >
        <View style={styles.top}>
          {loadingImg && (
            <ActivityIndicator
              size="large"
              color="#1976D2"
              style={{ position: "absolute" }}
            />
          )}

          <Image
            source={imgError ? placeholder : { uri: imageUrl }}
            style={styles.image}
            onLoadEnd={() => setLoadingImg(false)}
            onError={() => {
              setLoadingImg(false);
              setImgError(true);
            }}
          />
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{produto.nome}</Text>

          <Text style={styles.desc}>
            {produto.descricaoDetalhada || produto.descricao}
          </Text>
        </View>
      </ScrollView>

      {/* Área fixa inferior */}
      <View style={[styles.bottomFixed, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.row}>
          <Text style={styles.price}>R$ {price.toFixed(2)}</Text>

          {/* Quantidade */}
          <View style={styles.qtyBox}>
            <TouchableOpacity
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              style={styles.qtyBtn}
            >
              <Text style={styles.qtyText}>-</Text>
            </TouchableOpacity>

            <Text style={styles.qtyNumber}>{quantity}</Text>

            <TouchableOpacity
              onPress={() => setQuantity((q) => q + 1)}
              style={styles.qtyBtn}
            >
              <Text style={styles.qtyText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
          <Text style={styles.confirmText}>Adicionar à sacola</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  backBtn: {
    position: "absolute",
    left: 16,
    zIndex: 999,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
    elevation: 5,
  },

  top: {
    height: 380,
    width: "100%",
    backgroundColor: "#f1f1f1",
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  scrollArea: {
    flex: 1,
    marginTop: 10,
  },

  body: {
    padding: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },

  desc: {
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
    fontSize: 15,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  price: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1976D2",
  },

  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
  },

  qtyBtn: {
    width: 38,
    height: 38,
    backgroundColor: "#eee",
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  qtyText: { fontSize: 22, fontWeight: "700" },

  qtyNumber: {
    fontSize: 18,
    fontWeight: "700",
    marginHorizontal: 14,
  },

  bottomFixed: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },

  confirmBtn: {
    backgroundColor: "#1976D2",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  confirmText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
