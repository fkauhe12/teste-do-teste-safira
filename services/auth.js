// services/auth.js
import {
  auth,
  db,
  ref,
  set,
  get,
  serverTimestamp,
} from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";

const normalizeEmail = (email) => (email || "").trim().toLowerCase();
const onlyDigits = (v) => (v || "").replace(/\D/g, "");
const looksLikePhone = (v) => onlyDigits(v).length >= 8;
const phoneKeyFrom = (phone) => onlyDigits(phone); // usamos só dígitos como chave

// Envia email de verificação para o usuário logado
export const resendVerificationEmail = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Nenhum usuário autenticado");
  if (user.emailVerified) return;
  // Sem actionCodeSettings para usar o fluxo padrão do Firebase
  await sendEmailVerification(user);
};

export const register = async (userData) => {
  const {
    fullName,
    telefone,
    cpf, // opcional
    email,
    senha,
    address,
    city,
    state,
    houseNumber,
    zip,
  } = userData;

  const phoneKey = phoneKeyFrom(telefone);
  if (!phoneKey) throw new Error("Informe um telefone válido");

  // 1) Garantir que o telefone não está em uso
  const phoneRef = ref(db, `lookups/phones/${phoneKey}`);
  const phoneSnap = await get(phoneRef);
  if (phoneSnap.exists()) throw new Error("Telefone já cadastrado");

  // 2) Criar usuário no Auth
  const userCred = await createUserWithEmailAndPassword(
    auth,
    normalizeEmail(email),
    senha
  );
  const { uid } = userCred.user;

  // 3) Salvar perfil e lookup de telefone
  await Promise.all([
    set(ref(db, `users/${uid}`), {
      uid,
      fullName,
      telefone,
      telefoneSanitized: phoneKey,
      cpf: cpf || "",
      cpfSanitized: cpf ? onlyDigits(cpf) : "",
      email: normalizeEmail(email),
      address,
      city,
      state,
      houseNumber,
      zip,
      createdAt: serverTimestamp(),
    }),
    set(phoneRef, { uid, email: normalizeEmail(email) }),
    updateProfile(userCred.user, { displayName: fullName }).catch(() => {}),
  ]);

  // 4) Envia e-mail de verificação
  try {
    await sendEmailVerification(userCred.user);
  } catch {
    // silencioso; usuário pode reenviar na Step 4
  }

  return userCred;
};

export const login = async (identifier, password) => {
  // Permite login com e-mail OU telefone
  const id = (identifier || "").trim();
  let emailToUse = id;

  const digits = onlyDigits(id);
  const isPhone = looksLikePhone(id);

  if (isPhone && digits) {
    const snap = await get(ref(db, `lookups/phones/${digits}`));
    if (!snap.exists()) {
      const e = new Error("Telefone não cadastrado");
      e.code = "auth/user-not-found";
      throw e;
    }
    emailToUse = snap.val().email;
  }

  // Faz login
  const cred = await signInWithEmailAndPassword(auth, normalizeEmail(emailToUse), password);

  // Se não estiver verificado, envia e-mail e dispara erro específico.
  if (!cred.user.emailVerified) {
    try {
      await sendEmailVerification(cred.user);
    } catch {}
    const e = new Error("E-mail não verificado. Enviamos um novo link.");
    e.code = "auth/email-not-verified";
    throw e; // NOTA: o usuário permanece autenticado; a UI vai tratar (Step 4)
  }

  return cred;
};

export const mapAuthError = (error) => {
  const code = error?.code || "";
  switch (code) {
    case "auth/email-already-in-use":
      return "E-mail já cadastrado";
    case "auth/invalid-email":
      return "E-mail inválido";
    case "auth/weak-password":
      return "Senha muito fraca (mínimo 6 caracteres)";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "E-mail/telefone ou senha inválidos";
    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente mais tarde";
    case "auth/network-request-failed":
      return "Falha de rede. Verifique sua conexão";
    case "auth/email-not-verified":
      return "Seu e-mail ainda não foi verificado. Verifique sua caixa de entrada.";
    default:
      return error?.message || "Erro inesperado";
  }
};