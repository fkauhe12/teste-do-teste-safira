import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Animated,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets, SafeAreaProvider } from "react-native-safe-area-context";
import axios from "axios";
import StepIndicator from "../components/StepIndicator";

// ====> LOGIN + CADASTRO COM FLIP CARD <====
export default function LogScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  // ======== FLIP ANIMATION (RÁPIDO E FLUIDO) ========
  const flipCard = () => {
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      duration: 500 , // rápido e fluido
      useNativeDriver: true,
    }).start(() => setIsFlipped(!isFlipped));
  };

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 180],
          outputRange: ["0deg", "180deg"],
        }),
      },
    ],
  };
  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 180],
          outputRange: ["180deg", "360deg"],
        }),
      },
    ],
  };

  // ======== LOGIN ========
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
    Alert.alert("Login bem-sucedido", `Entrou como: ${identifier}`);
  };

  // ======== CADASTRO ========
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [passwordValid, setPasswordValid] = useState(null);
  const [passwordsMatch, setPasswordsMatch] = useState(null);
  const [emailValid, setEmailValid] = useState(null);
  const [zip, setZip] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [houseNumber, setHouseNumber] = useState("");

  useEffect(() => {
    if (zip.length === 8) {
      axios
        .get(`https://viacep.com.br/ws/${zip}/json/`)
        .then(({ data }) => {
          setAddress(data.logradouro || "");
          setCity(data.localidade || "");
          setState(data.uf || "");
        })
        .catch(() => alert("CEP inválido ou não encontrado"));
    }
  }, [zip]);

  useEffect(() => {
    if (!email) return setEmailValid(null);
    setEmailValid(/\S+@\S+\.\S+/.test(email));
  }, [email]);

  useEffect(() => {
    const valid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(senha);
    setPasswordValid(valid);
    setPasswordsMatch(senha === confirmSenha && confirmSenha.length > 0);
  }, [senha, confirmSenha]);

  const nextStep = () => {
    if (step === 1 && (!fullName.trim() || !username.trim() || !emailValid)) {
      alert("Preencha os dados corretamente.");
      return;
    }
    if (step === 2 && (!passwordValid || !passwordsMatch)) {
      alert("Verifique a senha.");
      return;
    }
    setStep(step + 1);
  };
  const finish = () => {
    alert("Cadastro concluído! 🎉");
    flipCard();
    setStep(1);
  };

  const Wrapper = Platform.OS === "web" ? View : KeyboardAvoidingView;
  const wrapperProps =
    Platform.OS === "web"
      ? { style: { flex: 1 } }
      : { style: { flex: 1 }, behavior: "padding", keyboardVerticalOffset: 20 };

  // ======== TELA ========
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: "transparent" }}>
      <Wrapper {...wrapperProps}>
        <View
          style={[
            styles.overlay,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
        />
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* ======== FRONT: LOGIN ======== */}
          <Animated.View
            style={[styles.card, frontAnimatedStyle, { opacity: isFlipped ? 0 : 1 }]}
          >
            <TouchableOpacity
              style={styles.backButtonInside}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.backText}>Voltar</Text>
            </TouchableOpacity>

            <View style={styles.logo}>
              <MaterialIcons name="lock" size={48} color="#fff" />
            </View>
            <Text style={styles.title}>Bem-vindo</Text>

            <TextInput
              style={[styles.input, errors.identifier && styles.inputError]}
              placeholder="Username, Email ou Telefone"
              placeholderTextColor="#ccc"
              value={identifier}
              onChangeText={(t) => {
                setIdentifier(t);
                setErrors((e) => ({ ...e, identifier: "" }));
              }}
            />
            {errors.identifier ? (
              <Text style={styles.errorText}>{errors.identifier}</Text>
            ) : null}

            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  { flex: 1, marginBottom: 0 },
                  errors.password && styles.inputError,
                ]}
                placeholder="Senha"
                placeholderTextColor="#ccc"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setErrors((e) => ({ ...e, password: "" }));
                }}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((s) => !s)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#ccc"
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => Alert.alert("Recuperar Senha", "Em desenvolvimento.")}
            >
              <Text style={styles.linkText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={flipCard}>
              <Text style={styles.linkText}>Criar Conta</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ======== BACK: CADASTRO ======== */}
          <Animated.View
            style={[styles.card, styles.cardBack, backAnimatedStyle, { opacity: isFlipped ? 1 : 0 }]}
          >
            <TouchableOpacity style={styles.backButtonInside} onPress={flipCard}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.backText}>Voltar</Text>
            </TouchableOpacity>

            <StepIndicator steps={3} currentStep={step - 1} style={{ marginBottom: 15 }} />
            <Text style={styles.stepText}>Passo {step} de 3</Text>

            {step === 1 && (
              <>
                <Text style={styles.title}>Criar Conta</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome completo"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholderTextColor="#888"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Usuário"
                  value={username}
                  onChangeText={setUsername}
                  placeholderTextColor="#888"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Telefone"
                  value={telefone}
                  onChangeText={setTelefone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#888"
                />
                <TextInput
                  style={styles.input}
                  placeholder="E-mail"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  placeholderTextColor="#888"
                />
                {emailValid === false && <Text style={styles.errorText}>E-mail inválido</Text>}
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.title}>Crie uma senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry
                  placeholderTextColor="#888"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar senha"
                  value={confirmSenha}
                  onChangeText={setConfirmSenha}
                  secureTextEntry
                  placeholderTextColor="#888"
                />
                {passwordValid === false && (
                  <Text style={styles.errorText}>
                    Senha deve ter 8 caracteres, 1 maiúscula, 1 minúscula e 1 número
                  </Text>
                )}
                {passwordsMatch === false && (
                  <Text style={styles.errorText}>Senhas não coincidem</Text>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.title}>Seu Endereço</Text>
                <TextInput
                  style={styles.input}
                  placeholder="CEP"
                  value={zip}
                  onChangeText={setZip}
                  keyboardType="numeric"
                  placeholderTextColor="#888"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Endereço"
                  value={address}
                  onChangeText={setAddress}
                  placeholderTextColor="#888"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Cidade"
                  value={city}
                  onChangeText={setCity}
                  placeholderTextColor="#888"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Estado"
                  value={state}
                  onChangeText={setState}
                  placeholderTextColor="#888"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Número"
                  value={houseNumber}
                  onChangeText={setHouseNumber}
                  keyboardType="numeric"
                  placeholderTextColor="#888"
                />
              </>
            )}

            <View style={styles.buttons}>
              {step > 1 && (
                <TouchableOpacity
                  style={[styles.button, styles.backButton]}
                  onPress={() => setStep(step - 1)}
                >
                  <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
              )}
              {step < 3 ? (
                <TouchableOpacity style={styles.button} onPress={nextStep}>
                  <Text style={styles.buttonText}>Próximo</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.button} onPress={finish}>
                  <Text style={styles.buttonText}>Finalizar</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </Wrapper>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)", // 👈 fundo mais leve e translúcido
  },
  centerContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    position: "absolute",
    width: "100%",
    backgroundColor: "#1e1e1e",
    borderRadius: 18,
    padding: 23,
    maxWidth: 480,
    backfaceVisibility: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardBack: { position: "absolute" },
  backButtonInside: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backText: { color: "#fff", marginLeft: 6, fontSize: 16 },
  logo: { alignItems: "center", marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 10 },
  
  input: {
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  passwordContainer: { flexDirection: "row", alignItems: "center" },
  eyeButton: { position: "absolute", right: 12, padding: 8 },
  primaryButton: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 12,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  linkButton: { alignItems: "center", paddingVertical: 6 },
  
  linkText: { 
    color: "#1E90FF", 
    fontSize: 18, 
    fontWeight: "bold", 
  
  },
  
  stepText: { color: "#fff", textAlign: "center", marginBottom: 10 },
  buttons: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  button: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  backButton: { backgroundColor: "#999" },
  backButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  
  errorText: { 
    color: "#e63946", 
    fontSize: 12, 
    textAlign: "center", 
    marginBottom: 5 },
});
