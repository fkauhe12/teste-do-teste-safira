// screens/LogScreen.js
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
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import axios from "axios";
import StepIndicator from "../components/StepIndicator";
import { register as registerUser, login as loginUser, mapAuthError } from "../services/auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../services/firebase";

export default function LogScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const lightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  const flipCard = () => {
    if (isAnimating || loading) return;
    setIsAnimating(true);

    const toValue = isFlipped ? 0 : 180;

    Animated.parallel([
      Animated.timing(flipAnim, {
        toValue,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(lightAnim, {
        toValue: isFlipped ? 0 : 1,
        duration: 350,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsFlipped(!isFlipped);
      setIsAnimating(false);
      lightAnim.setValue(0);
    });
  };

  const frontAnimatedStyle = {
    transform: [
      { perspective: 1000 },
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 180],
          outputRange: ["0deg", "180deg"],
        }),
      },
    ],
    shadowOpacity: flipAnim.interpolate({
      inputRange: [0, 90, 180],
      outputRange: [0.3, 0.6, 0.3],
    }),
  };

  const backAnimatedStyle = {
    transform: [
      { perspective: 1000 },
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 180],
          outputRange: ["-180deg", "0deg"],
        }),
      },
    ],
    shadowOpacity: flipAnim.interpolate({
      inputRange: [0, 90, 180],
      outputRange: [0.3, 0.6, 0.3],
    }),
  };

  const lightInterpolate = lightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0)", "rgba(255,255,255,0.2)"],
  });

  // ======== LOGIN ========
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ identifier: "", password: "" });

  const handleLogin = async () => {
    const newErrors = { identifier: "", password: "" };
    let hasError = false;
    if (!identifier.trim()) {
      newErrors.identifier = "Preencha o e-mail ou telefone.";
      hasError = true;
    }
    if (!password.trim()) {
      newErrors.password = "Digite sua senha.";
      hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;

    try {
      setLoading(true);
      await loginUser(identifier, password);
      navigation.replace("Home"); // vai direto pra Home ao logar
    } catch (e) {
      Alert.alert("Erro ao entrar", mapAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setIdentifier("");
      setPassword("");
      if (isFlipped) setIsFlipped(false);
      Alert.alert("Desconectado", "Você saiu da sua conta.");
    } catch (e) {
      Alert.alert("Erro ao sair", e?.message || "Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => navigation.replace("Home");

  // ======== CADASTRO ========
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
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
        .catch(() => Alert.alert("Atenção", "CEP inválido ou não encontrado"));
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
    const phoneDigits = telefone.replace(/\D/g, "");
    if (step === 1 && (!fullName.trim() || !emailValid || phoneDigits.length < 8)) {
      Alert.alert("Atenção", "Preencha os dados corretamente.");
      return;
    }
    if (step === 2 && (!passwordValid || !passwordsMatch)) {
      Alert.alert("Atenção", "Verifique a senha.");
      return;
    }
    setStep(step + 1);
  };

  const finish = async () => {
    const phoneDigits = telefone.replace(/\D/g, "");
    if (!fullName.trim() || !emailValid || phoneDigits.length < 8 || !passwordValid || !passwordsMatch) {
      Alert.alert("Atenção", "Preencha os dados corretamente.");
      return;
    }

    try {
      setLoading(true);
      await registerUser({
        fullName,
        telefone,
        email,
        senha,
        address,
        city,
        state,
        houseNumber,
        zip,
      });
      navigation.replace("Home");
    } catch (e) {
      Alert.alert("Erro no cadastro", mapAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  const Wrapper = Platform.OS === "web" ? View : KeyboardAvoidingView;
  const wrapperProps =
    Platform.OS === "web"
      ? { style: { flex: 1 } }
      : { style: { flex: 1 }, behavior: "padding", keyboardVerticalOffset: 20 };

  const displayName = currentUser?.displayName?.trim() || currentUser?.email || "";

  return (
    <Wrapper {...wrapperProps}>
      <View
        style={[
          styles.overlay,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      />
      <View style={styles.centerContainer}>
        {/* ======== FRONT ======== */}
        <Animated.View
          style={[styles.card, frontAnimatedStyle, { zIndex: isFlipped ? 0 : 10 }]}
        >
          <Animated.View
            pointerEvents="none"
            style={[styles.lightOverlay, { backgroundColor: lightInterpolate }]}
          />

          <TouchableOpacity
            style={styles.backButtonInside}
            onPress={() => navigation.goBack()}
            disabled={isAnimating || loading}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.logo}>
            <MaterialIcons name="lock" size={48} color="#fff" />
          </View>

          {!currentUser ? (
            <>
              <Text style={styles.title}>Bem-vindo</Text>

              <TextInput
                style={[styles.input, errors.identifier && styles.inputError]}
                placeholder="E-mail ou Telefone"
                placeholderTextColor="#ccc"
                value={identifier}
                onChangeText={(t) => {
                  setIdentifier(t);
                  setErrors((e) => ({ ...e, identifier: "" }));
                }}
                editable={!isAnimating && !loading}
                autoCapitalize="none"
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
                  editable={!isAnimating && !loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((s) => !s)}
                  disabled={isAnimating || loading}
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

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleLogin}
                disabled={isAnimating || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => Alert.alert("Recuperar Senha", "Em desenvolvimento.")}
                disabled={isAnimating || loading}
              >
                <Text style={styles.linkText}>Esqueceu sua senha?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={flipCard}
                disabled={isAnimating || loading}
              >
                <Text style={styles.linkText}>Criar Conta</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Já logado: mostra nome e opções
            <>
              <Text style={styles.title}>Você já está conectado</Text>
              <View style={styles.connectedBox}>
                <Ionicons name="person-circle-outline" size={48} color="#fff" />
                <Text style={styles.connectedText}>
                  {displayName}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleGoHome}
                disabled={isAnimating || loading}
              >
                <Text style={styles.buttonText}>Ir para Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: "#666" }]}
                onPress={handleSignOut}
                disabled={isAnimating || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Sair da conta</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        {/* ======== BACK: CADASTRO ======== */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            backAnimatedStyle,
            { zIndex: isFlipped ? 10 : 0 },
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[styles.lightOverlay, { backgroundColor: lightInterpolate }]}
          />

          <TouchableOpacity
            style={styles.backButtonInside}
            onPress={flipCard}
            disabled={isAnimating || loading}
          >
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
                editable={!isAnimating && !loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Telefone"
                value={telefone}
                onChangeText={(t) => setTelefone(t.replace(/\D/g, "").slice(0, 15))}
                keyboardType="phone-pad"
                placeholderTextColor="#888"
                editable={!isAnimating && !loading}
              />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                value={email}
                onChangeText={(t) => setEmail(t.trim())}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#888"
                editable={!isAnimating && !loading}
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
                editable={!isAnimating && !loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmar senha"
                value={confirmSenha}
                onChangeText={setConfirmSenha}
                secureTextEntry
                placeholderTextColor="#888"
                editable={!isAnimating && !loading}
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
                onChangeText={(t) => setZip(t.replace(/\D/g, "").slice(0, 8))}
                keyboardType="numeric"
                placeholderTextColor="#888"
                editable={!isAnimating && !loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Endereço"
                value={address}
                onChangeText={setAddress}
                placeholderTextColor="#888"
                editable={!isAnimating && !loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Cidade"
                value={city}
                onChangeText={setCity}
                placeholderTextColor="#888"
                editable={!isAnimating && !loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Estado"
                value={state}
                onChangeText={setState}
                placeholderTextColor="#888"
                editable={!isAnimating && !loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Número"
                value={houseNumber}
                onChangeText={setHouseNumber}
                keyboardType="numeric"
                placeholderTextColor="#888"
                editable={!isAnimating && !loading}
              />
            </>
          )}

          <View style={styles.buttons}>
            {step > 1 && (
              <TouchableOpacity
                style={[styles.button, styles.backButton]}
                onPress={() => setStep(step - 1)}
                disabled={isAnimating || loading}
              >
                <Text style={styles.backButtonText}>Voltar</Text>
              </TouchableOpacity>
            )}
            {step < 3 ? (
              <TouchableOpacity
                style={styles.button}
                onPress={nextStep}
                disabled={isAnimating || loading}
              >
                <Text style={styles.buttonText}>Próximo</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.button}
                onPress={finish}
                disabled={isAnimating || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Finalizar</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    backfaceVisibility: "hidden",
  },
  lightOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  cardBack: {
    alignSelf: "center",
  },
  backButtonInside: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  backText: { color: "#fff", marginLeft: 6, fontSize: 16 },
  logo: { alignItems: "center", marginBottom: 15 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 15 },
  input: {
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#e63946",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  eyeButton: { position: "absolute", right: 12, padding: 8 },
  primaryButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 15,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  linkButton: { alignItems: "center", paddingVertical: 8 },
  linkText: { color: "#1E90FF", fontSize: 16, fontWeight: "500" },
  stepText: { color: "#fff", textAlign: "center", marginBottom: 15 },
  buttons: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  button: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
  },
  backButton: { backgroundColor: "#666" },
  backButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  errorText: { color: "#e63946", fontSize: 13, textAlign: "center", marginBottom: 8 },
  connectedBox: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  connectedText: {
    color: "#fff",
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});