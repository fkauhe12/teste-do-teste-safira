import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
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

const INSTRUCTIONS = `
Você é um assistente virtual do Safira, focado em farmácia, saúde e nutrição.
Estilo:
- PT-BR, curto e empático.
- Use **negrito**.
`;

function parseBoldSegments(str) {
  if (typeof str !== "string") return [{ text: "", bold: false }];
  const result = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0, match;
  while ((match = regex.exec(str))) {
    if (match.index > lastIndex) result.push({ text: str.slice(lastIndex, match.index), bold: false });
    result.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) result.push({ text: str.slice(lastIndex), bold: false });
  return result;
}

function FormattedText({ text, textStyle, boldStyle }) {
  const segments = parseBoldSegments(text || "");
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

  const [barHeight, setBarHeight] = useState(76); // altura base da barra (sem teclado)
  const [kbHeight, setKbHeight] = useState(0);    // altura do teclado no Android
  const [kbVisible, setKbVisible] = useState(false);

  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Animação de entrada da modal
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Sobe só a barra no Android
  const kbAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Android: anima a barra com o teclado (gradiente fica ancorado no rodapé)
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onShow = (e) => {
      const h = e?.endCoordinates?.height || 0;
      const target = Math.max(0, h - insets.bottom);
      setKbVisible(true);
      setKbHeight(target);
      Animated.timing(kbAnim, {
        toValue: target,
        duration: 200,
        useNativeDriver: false,
      }).start();
    };

    const onHide = () => {
      setKbVisible(false);
      setKbHeight(0);
      Animated.timing(kbAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start();
    };

    const showSub = Keyboard.addListener("keyboardDidShow", onShow);
    const hideSub = Keyboard.addListener("keyboardDidHide", onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom, kbAnim]);

  // Mensagem inicial automática
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const first = (user.displayName || "Usuário").split(" ")[0];
      setUserName(first);
      setMessages([
        {
          id: Date.now().toString(),
          text: `Olá ${first}! Sou seu assistente virtual do Safira. Como posso ajudar hoje?`,
          sender: "bot",
        },
      ]);
    } else {
      setMessages([
        {
          id: Date.now().toString(),
          text: "Olá! Por favor, faça login para iniciar o atendimento.",
          sender: "bot",
        },
      ]);
    }
  }, []);

  const sendMessage = async () => {
    const user = auth.currentUser;
    if (!user || isSending || !text.trim()) return;

    const clean = text.trim();
    const userMessage = { id: Date.now().toString(), text: clean, sender: "user" };
    setMessages((prev) => [userMessage, ...prev]);
    setText("");
    setIsSending(true);

    try {
      const history = messages
        .slice(0, 10)
        .reverse()
        .map((m) => `${m.sender === "user" ? userName : "IA"}: ${m.text}`)
        .join("\n");
      const prompt = `${INSTRUCTIONS}\n\nHistórico:\n${history}\nUsuário: ${userMessage.text}\nIA:`;
      const botReply = await getAIResponse(prompt);
      const botMessage = { id: `${Date.now()}_bot`, text: botReply, sender: "bot" };
      setMessages((prev) => [botMessage, ...prev]);
      setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
    } catch {
      setMessages((prev) => [
        { id: `${Date.now()}_bot_error`, text: "Ops! Erro ao gerar resposta 😢", sender: "bot" },
        ...prev,
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 400,
      useNativeDriver: true,
    }).start(() => navigation.goBack());
  };

  // Espaço para a FlatList não ficar atrás do input/gradiente:
  // IMPORTANTE: como a lista é invertida, usamos paddingTop (não paddingBottom)
  const listTopPadding =
    15 + // padding do conteúdo
    barHeight + // altura da barra quando teclado fechado
    (Platform.OS === "android" ? kbHeight : 0); // sobe junto com teclado no Android

  return (
    <View style={styles.modalOverlay}>
      <Animated.View
        style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* iOS usa KeyboardAvoidingView; Android não (animamos só a barra) */}
        <KeyboardAvoidingView
          style={styles.flexContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={closeModal} style={styles.backButton}>
              <Ionicons name="arrow-back" size={26} color="#444" />
              <Text style={styles.backText}>Voltar</Text>
            </TouchableOpacity>
          </View>

          {/* CHAT + INPUT */}
          <View style={styles.chatContainer}>
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
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              contentContainerStyle={{ paddingHorizontal: 15, paddingTop: listTopPadding }}
              style={{ zIndex: 1 }}
            />

            {/* Gradiente FIXO ancorado no rodapé (não sobe com o teclado) */}
            <LinearGradient
              colors={["#051d74ff", "#0E2E98", "#2051f3ff"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              pointerEvents="none"
              style={[styles.footerGradient, { height: Math.max(barHeight, 72) }]}
            />

            {/* Barra de input (só ela sobe no Android) */}
            <Animated.View
              style={[
                styles.inputBar,
                {
                  bottom: Platform.OS === "android" ? kbAnim : 0,
                  paddingBottom: 12 + insets.bottom, // safe area
                },
              ]}
              onLayout={(e) => {
                // mede a altura real da barra apenas quando o teclado não está visível
                if (!kbVisible) {
                  setBarHeight(Math.ceil(e.nativeEvent.layout.height + 30));
                }
              }}
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
              <TouchableOpacity onPress={sendMessage} disabled={isSending || !auth.currentUser}>
                <View style={styles.sendButton}>
                  <Ionicons name="send" size={24} color="#3E57AC" />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: "93%", // evita travar altura quando teclado abre
    backgroundColor: "#e6e6e6",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden", // cantos arredondados OK
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: { marginLeft: 6, fontSize: 18, fontWeight: "600", color: "#444" },

  chatContainer: { flex: 1, justifyContent: "flex-end", position: "relative" },

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

  // Gradiente fixo no rodapé, atrás de tudo
  footerGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  // Barra de input (fica acima da lista e sobe no Android)
  inputBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: "transparent",
  },

  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});