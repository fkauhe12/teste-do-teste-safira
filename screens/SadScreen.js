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
  let lastIndex = 0,
    match;
  while ((match = regex.exec(str))) {
    if (match.index > lastIndex)
      result.push({ text: str.slice(lastIndex, match.index), bold: false });
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
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Slide da modal
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  // Altura do teclado animada (rápida)
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // As mensagens e o input sobem juntos quando o teclado aparece
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: 100, // mais rápido → menos delay
        useNativeDriver: false,
      }).start();
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
        {
          id: `${Date.now()}_bot_error`,
          text: "Ops! Erro ao gerar resposta 😢",
          sender: "bot",
        },
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

  return (
    <View style={styles.modalOverlay}>
      <Animated.View
        style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}
      >
        <KeyboardAvoidingView
          style={styles.flexContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={StatusBar.currentHeight || insets.top}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={closeModal} style={styles.backButton}>
              <Ionicons name="arrow-back" size={26} color="#444" />
              <Text style={styles.backText}>Voltar</Text>
            </TouchableOpacity>
          </View>

          {/* CHAT + INPUT juntos, animando com o teclado */}
          <Animated.View style={[styles.chatContainer, { marginBottom: keyboardHeight }]}>
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
              contentContainerStyle={{ padding: 15 }}
            />

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
              <TouchableOpacity onPress={sendMessage} disabled={isSending || !auth.currentUser}>
                <View style={styles.sendButton}>
                  <Ionicons name="send" size={24} color="#3E57AC" />
                </View>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
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
    height: SCREEN_HEIGHT * 0.93,
    backgroundColor: "#e6e6e6",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: { marginLeft: 6, fontSize: 18, fontWeight: "600", color: "#444" },

  chatContainer: { flex: 1, justifyContent: "flex-end" },

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
    paddingVertical: 16,
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