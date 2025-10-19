import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function LogScreen() {
  const navigation = useNavigation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ identifier: "", password: "" });

  const handleLogin = () => {
    const newErrors = { identifier: "", password: "" };
    let hasError = false;

    if (!identifier.trim()) {
      newErrors.identifier = "Preencha o username, email ou telefone.";
      hasError = true;
    }
    if (!password.trim()) {
      newErrors.password = "Digite sua senha.";
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    // 🔧 Compatível com Web e Mobile
    if (Platform.OS === "web") {
      window.alert(`Login bem-sucedido! Entrou como: ${identifier}`);
    } else {
      Alert.alert("Login bem-sucedido", `Entrou como: ${identifier}`);
    }
  };

  // Wrapper seguro para Web
  const Wrapper = Platform.OS === "web" ? View : KeyboardAvoidingView;
  const wrapperProps =
    Platform.OS === "web"
      ? { style: styles.wrapper }
      : { style: styles.wrapper, behavior: "padding", keyboardVerticalOffset: 20 };

  return (
    <Wrapper {...wrapperProps}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.box}>
          <TouchableOpacity style={styles.backButtonInside} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.logo}>
            <MaterialIcons name="lock" size={48} color="#fff" />
          </View>

          <Text style={styles.title}>Bem‑vindo</Text>

          <TextInput
            style={[styles.input, errors.identifier && styles.inputError]}
            placeholder="Username, Email ou Telefone"
            placeholderTextColor="#ccc"
            value={identifier}
            onChangeText={(text) => {
              setIdentifier(text);
              setErrors((e) => ({ ...e, identifier: "" }));
            }}
          />
          {errors.identifier ? <Text style={styles.errorText}>{errors.identifier}</Text> : null}

          {/* Campo de senha */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }, errors.password && styles.inputError]}
              placeholder="Senha"
              placeholderTextColor="#ccc"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors((e) => ({ ...e, password: "" }));
              }}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((s) => !s)}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#ccc" />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Logar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate("LogCadastro")}>
            <Text style={styles.linkText}>Criar Conta</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Recuperar Senha</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "transparent" },
  box: {
    width: "100%",
    backgroundColor: "#1e1e1e",
    borderRadius: 18,
    padding: 23,
    maxWidth: 480,
    alignSelf: "center",
  },
  backButtonInside: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backText: {
    marginLeft: 6,
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  logo: { alignItems: "center", marginBottom: 10 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "#2a2a2a",
  },
  inputError: { borderColor: "#e63946" },
  errorText: { color: "#e63946", fontSize: 13, marginBottom: 6 },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eyeButton: { position: "absolute", right: 12, padding: 8 },
  primaryButton: {
    backgroundColor: "#1E90FF",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 12,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  linkButton: { alignItems: "center", paddingVertical: 6 },
  linkText: { color: "#1E90FF", fontSize: 15, fontWeight: "500" },
});