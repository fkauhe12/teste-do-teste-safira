// screens/TesteImportacao.js
import React from "react";
import { View, Button, Alert } from "react-native";
import { importarProdutos } from "../services/importarProdutos";

export default function TesteImportacao() {
  const handleImport = async () => {
    Alert.alert("Importando...", "O envio dos produtos começou!");
    await importarProdutos();
    Alert.alert("Concluído ✅", "Todos os produtos foram enviados ao Firestore!");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button title="📦 Importar produtos para o Firestore" onPress={handleImport} />
    </View>
  );
}
