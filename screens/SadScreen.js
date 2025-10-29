import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  Keyboard,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAIResponse } from "../services/ai";
import { auth } from "../services/firebase";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Instruções para padronizar a resposta da IA
const INSTRUCTIONS = `
Você é um assistente virtual do Safira, focado em farmácia, saúde e nutrição.

Estilo:
- Responda em PT-BR, com linguagem empática, curta e direta.
- Pode usar negrito com **texto** para destacar títulos de seção e termos importantes.
- Use listas com "-" para passos e opções. Evite outros tipos de marcação (código, citações, títulos com #).

Escopo:
- Pode orientar sobre autocuidado, nutrição e medicamentos isentos de prescrição (OTC).
- Ao citar medicamentos, prefira o princípio ativo. Se for seguro, inclua dose adulta típica, intervalo, limite máximo diário e contraindicações resumidas.
- Não recomende medicamentos de prescrição (antibióticos, benzodiazepínicos, opioides, estimulantes, hormônios controlados).

Encaminhamento:
- Não repita "procure um médico" ao longo do texto.
- Coloque orientações de quando procurar ajuda apenas na seção 5 (no final), com sinais de alerta objetivos ou se não houver melhora em 48–72 h.

Formato de resposta (sempre nesta ordem):
1) **Possíveis causas e sintomas associados**
2) **O que tentar agora em casa**
3) **Remédios de farmácia comuns (OTC)**
4) **Nutrição e hábitos**
5) **Quando procurar ajuda**
6) **Perguntas rápidas**

Regras extras:
- Se o usuário pedir apenas "remédio", ainda siga o formato e faça 2–4 perguntas no final.
- Mantenha as respostas objetivas, evitando parágrafos muito longos.
`;

// Parser simples para renderizar **negrito** dentro do <Text />
function parseBoldSegments(str) {
  if (typeof str !== "string") return [{ text: "", bold: false }];
  const result = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str))) {
    if (match.index > lastIndex) {
      result.push({ text: str.slice(lastIndex, match.index), bold: false });
    }
    result.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) {
    result.push({ text: str.slice(lastIndex), bold: false });
  }
  return result;
}

function FormattedText({ text, textStyle, boldStyle }) {
  const segments = parseBoldSegments(text);
  return (
    <Text style={textStyle}>
      {segments.map((seg, i) => (
        <Text key={i} style={seg.bold ? [textStyle, boldStyle] : textStyle}>
          {seg.text}
        </Text>
      ))}
    </Text>
  );
}

export default function SadScreen({ navigation }) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userName, setUserName] = useState(null);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Abrir/fechar teclado (Android)
  useEffect(() => {
    if (Platform.OS === "android") {
      const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
        Animated.timing(keyboardHeight, {
          toValue: e.endCoordinates.height,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
      const hideSub = Keyboard.addListener("keyboardDidHide", () => {
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }
  }, []);

  // Mensagem inicial automática com nome do usuário logado
  useEffect(() => {
    const initChat = async () => {
      const user = auth.currentUser;
      if (user) {
        const fullName = user.displayName || "Usuário";
        const firstName = fullName.split(" ")[0];
        setUserName(firstName);

        const greeting = `Olá ${firstName}! Sou seu assistente virtual do Safira. Como posso te ajudar hoje?`;
        const botMessage = { id: Date.now().toString(), text: greeting, sender: "bot" };
        setMessages([botMessage]);
        console.log("Mensagem inicial da IA:", greeting);
      } else {
        const botMessage = {
          id: Date.now().toString(),
          text: "Olá! Por favor, faça login para iniciar o atendimento.",
          sender: "bot",
        };
        setMessages([botMessage]);
        console.log("Mensagem inicial da IA (não logado):", botMessage.text);
      }
    };
    initChat();
  }, []);

  // Enviar mensagem do usuário
  const sendMessage = async () => {
    const user = auth.currentUser;
    if (!user) {
      navigation.navigate("Log"); // envia para tela de login
      return;
    }

    const clean = text.trim();
    if (!clean || isSending) return;

    const userMessage = { id: Date.now().toString(), text: clean, sender: "user" };
    setMessages((prev) => [userMessage, ...prev]);
    console.log("Mensagem do usuário:", clean);
    setText("");
    setIsSending(true);

    try {
      // Construir prompt dinâmico com histórico
      const conversation = messages
        .slice(0, 10) // pega últimas 10 mensagens
        .reverse()
        .map((msg) => `${msg.sender === "user" ? (userName || "Usuário") : "IA"}: ${msg.text}`)
        .join("\n");

      const prompt = `
${INSTRUCTIONS}

Histórico da conversa:
${conversation}

Usuário: ${userMessage.text}
IA:
`;

      const botReply = await getAIResponse(prompt);
      console.log("Resposta da IA:", botReply);

      const botMessage = { id: `${Date.now()}_bot`, text: botReply, sender: "bot" };
      setMessages((prev) => [botMessage, ...prev]);

      setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
    } catch (e) {
      const botMessage = {
        id: `${Date.now()}_bot_error`,
        text: "Ops! Houve um erro ao gerar a resposta 😢 Tente novamente.",
        sender: "bot",
      };
      setMessages((prev) => [botMessage, ...prev]);
      console.error("Erro ao enviar mensagem:", e.message);
    } finally {
      setIsSending(false);
    }
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 800,
      useNativeDriver: true,
    }).start(() => navigation.goBack());
  };

  const renderInput = () => (
    <LinearGradient
      colors={["#051d74ff", "#0E2E98", "#2051f3ff"]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={[styles.inputContainer, { paddingBottom: insets.bottom + 6 }]}
    >
      <TextInput
        style={styles.input}
        placeholder="O que você está sentindo?"
        placeholderTextColor="#ccc"
        value={text}
        onChangeText={setText}
        editable={!isSending && !!auth.currentUser}
        returnKeyType="send"
        onSubmitEditing={sendMessage}
      />
      <TouchableOpacity
        style={styles.sendButton}
        onPress={sendMessage}
        disabled={isSending || !auth.currentUser}
      >
        <Ionicons name="send" size={24} color="#3E57AC" />
      </TouchableOpacity>
    </LinearGradient>
  );

  return (
    <View style={styles.modalOverlay}>
      <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={StatusBar.currentHeight || insets.top}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={closeModal}>
              <Ionicons name="arrow-back" size={26} color="#444" />
              <Text style={styles.backText}>Voltar</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isUser = item.sender === "user";
              return (
                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  <FormattedText
                    text={item.text}
                    textStyle={[
                      styles.messageText,
                      isUser ? styles.userText : styles.botText,
                    ]}
                    boldStyle={styles.boldText}
                  />
                </View>
              );
            }}
            inverted
            contentContainerStyle={{ padding: 15, paddingBottom: insets.bottom + 10 }}
          />

          {Platform.OS === "ios"
            ? renderInput()
            : <Animated.View style={{ marginBottom: keyboardHeight }}>{renderInput()}</Animated.View>}
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
  modalContainer: {
    height: SCREEN_HEIGHT * 0.93,
    backgroundColor: "#e6e6e6",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 12 },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: { marginLeft: 6, fontSize: 18, fontWeight: "600", color: "#444" },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  botBubble: { alignSelf: "flex-start", backgroundColor: "#fff", borderBottomLeftRadius: 4 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#3E57AC", borderBottomRightRadius: 4 },
  messageText: { fontSize: 16, lineHeight: 22 },
  botText: { color: "#000" },
  userText: { color: "#fff" },
  boldText: { fontWeight: "700" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 18,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 16,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});