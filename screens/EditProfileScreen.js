import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { onValue, ref, update, get, set, remove } from "firebase/database";
import { auth, db } from "../services/firebase";
import {
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";

const onlyDigits = (v = "") => String(v).replace(/\D/g, "");
const normalizeEmail = (v = "") => String(v).trim().toLowerCase();
const isValidEmail = (v = "") => /\S+@\S+\.\S+/.test(normalizeEmail(v));
const strongPassword = (v = "") => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);

export default function EditProfileScreen({ navigation }) {
  const [userData, setUserData] = useState({
    fullName: "",
    telefone: "",
    telefoneSanitized: "",
    email: "",
    cpf: "",
    address: "",
    city: "",
    state: "",
    houseNumber: "",
    zip: "",
  });

  const [senhaNova, setSenhaNova] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [senhaAtual, setSenhaAtual] = useState(""); // reautenticação ao trocar email/senha
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [prevPhoneSan, setPrevPhoneSan] = useState("");

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      Alert.alert("Erro", "Usuário não autenticado");
      navigation.goBack();
      return;
    }
    setEmailVerified(!!user.emailVerified);

    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const loaded = {
          fullName: data.fullName || user.displayName || "",
          telefone: data.telefone || "",
          telefoneSanitized: data.telefoneSanitized || onlyDigits(data.telefone || ""),
          email: data.email || user.email || "",
          cpf: data.cpf || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          houseNumber: data.houseNumber || "",
          zip: data.zip || "",
        };
        setUserData(loaded);
        setPrevPhoneSan(loaded.telefoneSanitized);
      } else {
        setUserData((prev) => ({
          ...prev,
          fullName: user.displayName || "",
          email: user.email || "",
        }));
        setPrevPhoneSan(onlyDigits(""));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleBuscarEndereco = async (cep) => {
    const zip = onlyDigits(cep);
    if (zip.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
      const data = await response.json();
      if (data?.erro) {
        Alert.alert("Erro", "CEP não encontrado");
        return;
      }
      setUserData((prev) => ({
        ...prev,
        address: data.logradouro || prev.address,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
    } catch {
      Alert.alert("Erro", "Falha ao buscar o endereço");
    }
  };

  const validate = () => {
    const errors = [];

    if (!userData.fullName.trim()) errors.push("Nome não pode ficar em branco.");
    if (!userData.address.trim()) errors.push("Endereço não pode ficar em branco.");

    if (!userData.email.trim() || !isValidEmail(userData.email)) {
      errors.push("E-mail inválido.");
    }

    const phoneDigits = onlyDigits(userData.telefone);
    if (phoneDigits.length < 8) errors.push("Telefone deve ter pelo menos 8 dígitos.");

    const cpfDigits = onlyDigits(userData.cpf);
    if (userData.cpf && cpfDigits.length !== 11) {
      errors.push("CPF deve ter 11 dígitos (ou deixe em branco).");
    }

    if (senhaNova || confirmarSenha) {
      if (!strongPassword(senhaNova)) {
        errors.push("Senha fraca: mínimo 8 com maiúscula, minúscula e número.");
      }
      if (senhaNova !== confirmarSenha) {
        errors.push("As senhas não coincidem.");
      }
    }

    if (errors.length) {
      Alert.alert("Corrija os campos", errors.join("\n"));
      return false;
    }
    return true;
  };

  // Reautentica se necessário (quando for alterar e-mail ou senha)
  const reauthenticateIfNeeded = async (needsReauth) => {
    if (!needsReauth) return true;
    if (!senhaAtual.trim()) {
      Alert.alert("Atenção", "Informe sua senha atual para confirmar as alterações.");
      return false;
    }
    try {
      const cred = EmailAuthProvider.credential(user.email, senhaAtual);
      await reauthenticateWithCredential(user, cred);
      return true;
    } catch (e) {
      Alert.alert("Erro", "Não foi possível reautenticar. Verifique sua senha atual.");
      return false;
    }
  };

  const handleSave = async () => {
    if (!user) return Alert.alert("Erro", "Usuário não autenticado");
    if (!validate()) return;

    const newEmail = normalizeEmail(userData.email);
    const emailChanged = newEmail !== normalizeEmail(user.email || "");
    const phoneDigits = onlyDigits(userData.telefone);
    const phoneChanged = phoneDigits !== prevPhoneSan;

    setSaving(true);
    try {
      // Verifica disponibilidade do telefone (lookup) se mudou
      if (phoneChanged) {
        const newKeyRef = ref(db, `lookups/phones/${phoneDigits}`);
        const snap = await get(newKeyRef);
        if (snap.exists() && snap.val()?.uid !== user.uid) {
          Alert.alert("Erro", "Telefone já cadastrado em outra conta.");
          setSaving(false);
          return;
        }
      }

      // Reautentica se trocar e-mail ou senha
      const needsReauth = emailChanged || !!senhaNova;
      const ok = await reauthenticateIfNeeded(needsReauth);
      if (!ok) {
        setSaving(false);
        return;
      }

      // Atualiza e-mail se mudou
      if (emailChanged) {
        await updateEmail(user, newEmail);
        try {
          await sendEmailVerification(user);
          Alert.alert("E-mail atualizado", "Enviamos um e-mail de verificação para o novo endereço.");
        } catch {}
        setEmailVerified(false);
      }

      // Atualiza senha se informada
      if (senhaNova) {
        await updatePassword(user, senhaNova);
        Alert.alert("Senha alterada", "Sua senha foi atualizada.");
      }

      // Atualiza displayName (Auth) se nome mudou
      if (user.displayName !== userData.fullName.trim()) {
        try {
          await updateProfile(user, { displayName: userData.fullName.trim() });
        } catch {}
      }

      // Atualiza dados no RTDB
      const updates = {
        fullName: userData.fullName.trim(),
        telefone: userData.telefone,
        telefoneSanitized: phoneDigits,
        cpf: onlyDigits(userData.cpf),
        email: newEmail,
        address: userData.address.trim(),
        city: userData.city,
        state: userData.state,
        houseNumber: userData.houseNumber,
        zip: onlyDigits(userData.zip).slice(0, 8),
      };
      await update(ref(db, `users/${user.uid}`), updates);

      // Atualiza lookup de telefone se mudou
      if (phoneChanged) {
        try {
          if (prevPhoneSan) {
            await remove(ref(db, `lookups/phones/${prevPhoneSan}`));
          }
          await set(ref(db, `lookups/phones/${phoneDigits}`), {
            uid: user.uid,
            email: newEmail,
          });
          setPrevPhoneSan(phoneDigits);
        } catch {}
      }

      Alert.alert("Sucesso", "Dados atualizados com sucesso!");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      const msg =
        error?.code === "auth/invalid-email"
          ? "E-mail inválido."
          : error?.code === "auth/email-already-in-use"
          ? "E-mail já está em uso."
          : error?.code === "auth/requires-recent-login"
          ? "Por segurança, faça login novamente."
          : error?.message || "Falha ao atualizar dados.";
      Alert.alert("Erro", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user || user.emailVerified) return;
    try {
      await sendEmailVerification(user);
      Alert.alert("Enviado", "Verifique sua caixa de entrada e spam.");
    } catch (e) {
      Alert.alert("Erro", e?.message || "Não foi possível enviar agora.");
    }
  };

  const handleResetPasswordEmail = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert("Enviado", "E-mail de redefinição enviado.");
    } catch (e) {
      Alert.alert("Erro", e?.message || "Não foi possível enviar agora.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <Text style={{ color: "#fff" }}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔙 Voltar */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#000" />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      {/* 🔹 Conteúdo */}
      <View style={styles.grayContainer}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Editar Perfil</Text>

          {/* Nome (Obrigatório) */}
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput
            style={styles.input}
            value={userData.fullName}
            onChangeText={(text) => setUserData({ ...userData, fullName: text })}
            placeholder="Seu nome"
          />

          {/* E-mail (editável) + status verificação */}
          <Text style={styles.label}>E-mail</Text>
          <View style={{ marginBottom: 10 }}>
            <TextInput
              style={styles.input}
              value={userData.email}
              onChangeText={(text) =>
                setUserData({ ...userData, email: normalizeEmail(text) })
              }
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="seu@email.com"
            />
            <View style={styles.row}>
              <Text
                style={[
                  styles.badge,
                  emailVerified ? styles.badgeOk : styles.badgeWarn,
                ]}
              >
                {emailVerified ? "Verificado" : "Não verificado"}
              </Text>
              {!emailVerified && (
                <TouchableOpacity
                  onPress={handleResendVerification}
                  style={[styles.smallBtn, { marginLeft: 10 }]}
                >
                  <Text style={styles.smallBtnText}>Reenviar verificação</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* CPF (opcional) */}
          <Text style={styles.label}>CPF (opcional)</Text>
          <TextInput
            style={styles.input}
            value={userData.cpf}
            onChangeText={(text) =>
              setUserData({ ...userData, cpf: onlyDigits(text).slice(0, 11) })
            }
            keyboardType="numeric"
            maxLength={11}
            placeholder="Digite seu CPF"
          />

          {/* Telefone */}
          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            value={userData.telefone}
            onChangeText={(text) =>
              setUserData({
                ...userData,
                telefone: onlyDigits(text).slice(0, 15),
              })
            }
            keyboardType="phone-pad"
            placeholder="DDD + número"
            maxLength={15}
          />

          {/* Trocar Senha (opcional) */}
          <Text style={styles.label}>Nova Senha (opcional)</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={senhaNova}
              onChangeText={setSenhaNova}
              placeholder="Nova senha forte"
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword((s) => !s)}
              style={{ marginLeft: 10 }}
            >
              <Ionicons
                name={showNewPassword ? "eye-off" : "eye"}
                size={22}
                color="#555"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirmar Nova Senha</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              placeholder="Confirme a nova senha"
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword((s) => !s)}
              style={{ marginLeft: 10 }}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={22}
                color="#555"
              />
            </TouchableOpacity>
          </View>

          {/* Senha atual (aparece aqui embaixo quando digitar Nova Senha ou alterar e-mail) */}
          {(!!senhaNova || normalizeEmail(userData.email) !== normalizeEmail(user?.email || "")) && (
            <>
              <Text style={styles.label}>Senha atual (para confirmar)</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={senhaAtual}
                  onChangeText={setSenhaAtual}
                  placeholder="Digite sua senha atual"
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword((s) => !s)}
                  style={{ marginLeft: 10 }}
                >
                  <Ionicons
                    name={showCurrentPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#555"
                  />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Esqueci a senha */}
          <TouchableOpacity style={styles.linkBtn} onPress={handleResetPasswordEmail}>
            <Text style={styles.linkText}>Esqueci minha senha (enviar e-mail)</Text>
          </TouchableOpacity>

          {/* CEP */}
          <Text style={styles.label}>CEP</Text>
          <TextInput
            style={styles.input}
            value={userData.zip}
            onChangeText={(text) => {
              const clean = onlyDigits(text).slice(0, 8);
              setUserData({ ...userData, zip: clean });
              if (clean.length === 8) handleBuscarEndereco(clean);
            }}
            keyboardType="numeric"
            placeholder="Digite seu CEP"
            maxLength={8}
          />

          {/* Endereço (obrigatório) */}
          <Text style={styles.label}>Endereço</Text>
          <TextInput
            style={styles.input}
            value={userData.address}
            onChangeText={(text) => setUserData({ ...userData, address: text })}
            placeholder="Rua, Av., etc."
          />

          {/* Cidade */}
          <Text style={styles.label}>Cidade</Text>
          <TextInput
            style={styles.input}
            value={userData.city}
            onChangeText={(text) => setUserData({ ...userData, city: text })}
          />

          {/* Estado */}
          <Text style={styles.label}>Estado</Text>
          <TextInput
            style={styles.input}
            value={userData.state}
            onChangeText={(text) => setUserData({ ...userData, state: text })}
          />

          {/* Número */}
          <Text style={styles.label}>Número</Text>
          <TextInput
            style={styles.input}
            value={userData.houseNumber}
            onChangeText={(text) =>
              setUserData({ ...userData, houseNumber: onlyDigits(text).slice(0, 8) })
            }
            keyboardType="numeric"
          />

          {/* Botão Salvar */}
          <TouchableOpacity
            style={[styles.button, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.buttonText}>{saving ? "Salvando..." : "Salvar Alterações"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#046cf5ff",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  grayContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    flex: 1,
  },
  scroll: { paddingBottom: 40 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#000",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    color: "#fff",
    overflow: "hidden",
    fontSize: 12,
  },
  badgeOk: { backgroundColor: "#2e7d32" },
  badgeWarn: { backgroundColor: "#e53935" },

  smallBtn: {
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallBtnText: { color: "#333", fontWeight: "600" },

  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 10,
    marginTop: 12,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backText: { marginLeft: 5, fontSize: 16, color: "#000" },
  linkBtn: { alignSelf: "flex-start", marginBottom: 10 },
  linkText: { color: "#1E90FF", fontWeight: "600" },
});