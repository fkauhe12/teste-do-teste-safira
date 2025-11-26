import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
  Dimensions,
  FlatList,
  SafeAreaView,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView, AnimatePresence } from "moti";
import { useCart } from "../context/CartContext";
import { createDeliveryOrder } from "../services/delivery";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Ícone multiplataforma (nome modificado para evitar conflito)
const getCartIconSourceCart = () => {
  try {
    const img = require("../assets/icons/icon_car_vazio.png");
    if (Platform.OS === "web") {
      return { uri: img?.default ?? "../assets/icons/icon_car_vazio.png" };
    }
    return img;
  } catch {
    return { uri: "../assets/icons/icon_car_vazio.png" };
  }
};

export default function CartScreen({ navigation }) {
  const {
    cartItems,
    increaseQty,
    decreaseQty,
    removeFromCart,
    clearCart,
  } = useCart();

  const [cupom, setCupom] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [pagamento, setPagamento] = useState(null);
  const [loadingPedido, setLoadingPedido] = useState(false);
  const [cupomAplicado, setCupomAplicado] = useState(null);

  // ANIMAÇÃO
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => navigation.goBack());
  };

  // Cálculo do total
  const totalBruto = cartItems.reduce(
    (soma, item) => soma + item.preco * item.quantidade,
    0
  );

  const descontoValor = totalBruto * desconto;
  const totalFinal = totalBruto - descontoValor;

  // Componente interno para imagem do produto com fallback
  function ProductImage({ uri, style }) {
    const [error, setError] = useState(false);
    const placeholder = require("../assets/icons/icon_car_vazio.png");
    const source = error || !uri ? placeholder : { uri };
    return <Image source={source} style={style} onError={() => setError(true)} />;
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>

        {/* IMAGEM DO PRODUTO (aceita vários nomes de campo vindos do backend) */}
        <ProductImage
          uri={
            item.imageUrl || item.image || item.imagem || item.img || item.foto || item.url || null
          }
          style={{ width: 60, height: 60, borderRadius: 10 }}
        />

        {/* INFORMAÇÕES */}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.nome}>{item.nome}</Text>
          <Text style={styles.preco}>R$ {item.preco.toFixed(2)}</Text>
        </View>

        {/* QUANTIDADE */}
        <View style={styles.qtdBox}>
          <TouchableOpacity onPress={() => increaseQty(item.id)}>
            <Ionicons name="add" size={20} color="#000" />
          </TouchableOpacity>

          <Text style={{ marginHorizontal: 8 }}>{item.quantidade}</Text>

          <TouchableOpacity onPress={() => decreaseQty(item.id)}>
            <Ionicons name="remove" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* REMOVER ITEM */}
        <TouchableOpacity onPress={() => removeFromCart(item.id)}>
          <Ionicons name="trash" size={24} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.overlay}>
      <View style={styles.backgroundOverlay} />

      <Animated.View
        style={[
          styles.modalContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* HEADER */}
        <SafeAreaView>
          <View style={styles.headerRow}>

            {/* VOLTAR */}
            <TouchableOpacity style={styles.headerBtn} onPress={closeModal}>
              <Ionicons
                name="arrow-back-sharp"
                size={24}
                color="rgba(0,0,0,0.32)"
              />
              <Text style={styles.headerText}>Voltar</Text>
            </TouchableOpacity>

            {/* LIMPAR CESTA — agora no lado direito */}
            <TouchableOpacity
              onPress={clearCart}
              style={styles.clearBtn}
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.clearText}>Limpar Cesta</Text>
            </TouchableOpacity>

          </View>
        </SafeAreaView>

        <AnimatePresence exitBeforeEnter>
          {cartItems.length === 0 ? (
            // CARRINHO VAZIO
            <MotiView
              key="vazio"
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={styles.containerVazio}
            >
              <Text style={styles.textVazio}>Cesta Vazia</Text>
              <Image source={getCartIconSourceCart()} style={styles.imagemVazio} />
              <Text style={styles.textVazio}>Adicione Produtos</Text>
            </MotiView>
          ) : (
            // CARRINHO COM ITENS
            <MotiView
              key="cheio"
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ flex: 1 }}
            >
              <FlatList
                data={cartItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
              />

              {/* RESUMO DE PAGAMENTO */}
              <View style={styles.resumo}>
                {/* CUPOM */}
                <Text style={{ fontSize: 15, fontWeight: "600", marginBottom: 8 }}>Cupom</Text>
                <View style={{ flexDirection: "row", marginBottom: 12 }}>
                  <TextInput
                    placeholder="Código do cupom"
                    value={cupom}
                    onChangeText={setCupom}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: "#ccc",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      height: 44,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      // lógica simples de cupom
                      if (!cupom) return Alert.alert("Aviso", "Insira um código de cupom");
                      const code = cupom.trim().toUpperCase();
                      if (code === "SAVE10") {
                        setDesconto(0.1);
                        setCupomAplicado(code);
                        Alert.alert("Cupom aplicado", "10% de desconto aplicado.");
                      } else if (code === "SAVE5") {
                        setDesconto(0.05);
                        setCupomAplicado(code);
                        Alert.alert("Cupom aplicado", "5% de desconto aplicado.");
                      } else {
                        setDesconto(0);
                        setCupomAplicado(null);
                        Alert.alert("Cupom inválido", "Código não reconhecido.");
                      }
                    }}
                    style={{
                      marginLeft: 8,
                      backgroundColor: "#425bab",
                      paddingHorizontal: 12,
                      justifyContent: "center",
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Aplicar</Text>
                  </TouchableOpacity>
                </View>

                {/* MOSTRAR SUBTOTAL / DESCONTO / TOTAL */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ textAlign: "right" }}>Subtotal: R$ {totalBruto.toFixed(2)}</Text>
                  <Text style={{ textAlign: "right", color: "#d90429" }}>Desconto: R$ {descontoValor.toFixed(2)}</Text>
                </View>

                <Text style={styles.labelPagamento}>Pagamento na entrega:</Text>

                <View style={styles.pagamentoBox}>
                  {["Crédito", "Débito", "Dinheiro"].map((op) => (
                    <TouchableOpacity
                      key={op}
                      style={[
                        styles.opcaoPagamento,
                        pagamento === op && styles.pagamentoSelecionado,
                      ]}
                      onPress={() => setPagamento(op)}
                    >
                      <Text
                        style={[
                          styles.txtPagamento,
                          pagamento === op && styles.txtPagamentoSel,
                        ]}
                      >
                        {op}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.total}>Total: R$ {totalFinal.toFixed(2)}</Text>

                <TouchableOpacity
                  onPress={async () => {
                    if (!pagamento) return Alert.alert("Pagamento", "Selecione o método de pagamento");
                    if (cartItems.length === 0) return Alert.alert("Carrinho vazio", "Adicione produtos antes de finalizar.");

                    try {
                      setLoadingPedido(true);

                      const order = {
                        items: cartItems,
                        subtotal: totalBruto,
                        desconto: descontoValor,
                        total: totalFinal,
                        pagamento,
                        cupom: cupomAplicado,
                        createdAt: Date.now(),
                      };

                      const resp = await createDeliveryOrder(order);

                      // Limpa carrinho e navega para Status de entrega
                      clearCart();
                      navigation.navigate("EntregaStatus", { orderId: resp.id, order: { ...order, id: resp.id } });
                    } catch (err) {
                      console.error(err);
                      Alert.alert("Erro", "Falha ao criar pedido. Tente novamente.");
                    } finally {
                      setLoadingPedido(false);
                    }
                  }}
                >
                  <LinearGradient
                    colors={["#718fff", "#425bab"]}
                    style={[styles.btnFinalizar, loadingPedido && { opacity: 0.7 }]}
                  >
                    {loadingPedido ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.txtFinalizar}>Finalizar Compra</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalContainer: {
    height: "93%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    marginLeft: 6,
    fontSize: 19,
    fontWeight: "600",
    color: "rgba(0,0,0,0.32)",
  },

  /* BOTÃO LIMPAR */
  clearBtn: {
    flexDirection: "row",
    backgroundColor: "#d90429",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  clearText: {
    color: "#fff",
    marginLeft: 4,
    fontWeight: "bold",
  },

  containerVazio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textVazio: {
    fontSize: 26,
    fontWeight: "bold",
  },
  imagemVazio: {
    width: 300,
    height: 300,
    resizeMode: "contain",
    marginVertical: 20,
  },

  card: {
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  nome: { fontWeight: "bold" },
  preco: { color: "#007bff", fontWeight: "600" },

  qtdBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 6,
  },

  resumo: {
    backgroundColor: "#fff",
    padding: 15,
    borderTopWidth: 2,
    borderColor: "#ddd",
    marginTop: 20,
   
  },

  labelPagamento: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  pagamentoBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  opcaoPagamento: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
  },
  pagamentoSelecionado: {
    backgroundColor: "#425bab",
    borderColor: "#425bab",
  },
  txtPagamento: {
    fontWeight: "bold",
    color: "#444",
  },
  txtPagamentoSel: {
    color: "#fff",
  },

  total: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 10,
  },
  btnFinalizar: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  txtFinalizar: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
