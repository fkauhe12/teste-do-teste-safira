import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import axios from "axios";
import StepIndicator from "../components/StepIndicator";

let MaskedInput = TextInput;
try {
  const { TextInputMask } = require("react-native-masked-text");
  if (Platform.OS !== "web") MaskedInput = TextInputMask;
} catch {
  MaskedInput = TextInput;
}

export default function LogCadastroScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // ----------------------- estados gerais -----------------------
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [emailValid, setEmailValid] = useState(null);
  const [passwordValid, setPasswordValid] = useState(null);
  const [passwordsMatch, setPasswordsMatch] = useState(null);

  // ----------------------- busca de CEP --------------------------
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

  // ----------------------- validações ----------------------------
  useEffect(() => {
    if (!email) return setEmailValid(null);
    setEmailValid(/\S+@\S+\.\S+/.test(email));
  }, [email]);

  useEffect(() => {
    const valid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
    setPasswordValid(valid);
    setPasswordsMatch(password === confirmPassword && confirmPassword.length > 0);
  }, [password, confirmPassword]);

  // ----------------------- navegação de etapas -------------------
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

  const handleBack = () => (step === 1 ? navigation.goBack() : setStep(step - 1));
  const finish = () => {
    alert("Cadastro concluído! 🎉");
    navigation.goBack();
  };

  // ----------------------- renderização --------------------------
  const renderStepIndicator = () => (
    <StepIndicator
      steps={3}
      currentStep={step - 1}
      style={styles.stepIndicator}
    />
  );

  const Wrapper = Platform.OS === "web" ? View : KeyboardAvoidingView;
  const wrapperProps =
    Platform.OS === "web"
      ? { style: { flex: 1 } }
      : {
          style: { flex: 1 },
          behavior: "padding",
          keyboardVerticalOffset: 20,
        };

  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          paddingTop:
            Platform.OS === "android"
              ? StatusBar.currentHeight || insets.top
              : insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <Wrapper {...wrapperProps}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {renderStepIndicator()}
            <Text style={styles.stepText}>Passo {step} de 3</Text>

            {/* ---------- STEP 1 ---------- */}
            {step === 1 && (
              <View style={{ width: "100%" }}>
                <Text style={styles.title}>Criar Conta</Text>
                <Text style={styles.subtitle}>Vamos começar!</Text>
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
                <MaskedInput
                  type={Platform.OS !== "web" ? "cel-phone" : undefined}
                  options={{ maskType: "BRL", withDDD: true, dddMask: "(99) " }}
                  value={telefone}
                  onChangeText={setTelefone}
                  style={styles.input}
                  placeholder="Número"
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
                {emailValid === false && (
                  <Text style={styles.errorText}>E-mail inválido</Text>
                )}
              </View>
            )}

            {/* ---------- STEP 2 ---------- */}
            {step === 2 && (
              <View style={{ width: "100%" }}>
                <Text style={styles.title}>Crie uma senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor="#888"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirme a senha"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholderTextColor="#888"
                />
                {passwordValid === false && (
                  <Text style={styles.errorText}>
                    Senha deve ter 8 caracteres, 1 maiúscula, 1 minúscula e 1
                    número
                  </Text>
                )}
                {passwordsMatch === false && (
                  <Text style={styles.errorText}>Senhas não coincidem</Text>
                )}
              </View>
            )}

            {/* ---------- STEP 3 ---------- */}
            {step === 3 && (
              <View style={{ width: "100%" }}>
                <Text style={styles.title}>Seu endereço</Text>
                <TextInput
                  style={styles.input}
                  placeholder="CEP"
                  value={zip}
                  onChangeText={setZip}
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
              </View>
            )}

            {/* ---------- BOTÕES ---------- */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, styles.backButton]}
                onPress={handleBack}
              >
                <Text style={styles.backButtonText}>Voltar</Text>
              </TouchableOpacity>

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
          </View>
        </ScrollView>
      </Wrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#121212" },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 25,
  },
  container: {
    width: "90%",
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#1e1e1e",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  stepIndicator: {
    marginVertical: 20,
  },
  stepText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 15,
    color: "#fff",
    textAlign: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
    color: "#fff",
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "500",
    marginBottom: 15,
    textAlign: "center",
    color: "#fff",
  },
  input: {
    width: "100%",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    color: "#fff",
  },
  errorText: {
    fontSize: 12,
    color: "#D8000C",
    marginBottom: 8,
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  backButton: { backgroundColor: "#999" },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});