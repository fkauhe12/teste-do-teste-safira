import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  FlatList,
  Keyboard,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets , SafeAreaProvider } from "react-native-safe-area-context";

export default function SadScreen({ navigation }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Olá! Sou um assistente virtual do Safira, como posso ajudar?",
      sender: "bot",
    },
  ]);

  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const keyboardHeight = useRef(new Animated.Value(0)).current;

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
  }, [keyboardHeight]);

  const sendMessage = () => {
    if (text.trim() === "") return;
    const newMessage = { id: Date.now().toString(), text, sender: "user" };
    setMessages((prev) => [newMessage, ...prev]);
    setText("");
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  };

  const renderInput = () => (
    <LinearGradient
      colors={["#051d74ff", "#0E2E98", "#2051f3ff"]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.inputContainer,
        { paddingBottom: insets.bottom + 6 }, // respeita área inferior
      ]}
    >
      <TextInput
        style={styles.input}
        placeholder="O que você está sentindo?"
        placeholderTextColor="#ccc"
        value={text}
        onChangeText={setText}
      />
      <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
        <Ionicons name="send" size={24} color="#000" />
      </TouchableOpacity>
    </LinearGradient>
  );

  return (
    <SafeAreaProvider
      style={[
        styles.safe,
        {
          paddingTop:
            Platform.OS === "android"
              ? StatusBar.currentHeight || insets.top
              : insets.top,
        },
      ]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={StatusBar.currentHeight || 0}
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
          >
            <Ionicons name="arrow-back" size={26} color="#444" />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de mensagens */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.sender === "user"
                  ? styles.userBubble
                  : styles.botBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  item.sender === "user"
                    ? styles.userText
                    : styles.botText,
                ]}
              >
                {item.text}
              </Text>
            </View>
          )}
          inverted
          contentContainerStyle={{
            padding: 15,
            paddingBottom: insets.bottom + 10,
          }}
        />

        {/* Campo de entrada */}
        {Platform.OS === "ios" ? (
          renderInput()
        ) : (
          <Animated.View style={{ marginBottom: keyboardHeight }}>
            {renderInput()}
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#e6e6e6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: {
    marginLeft: 6,
    fontSize: 18,
    fontWeight: "600",
    color: "#444",
  },
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
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#3E57AC",
    borderBottomRightRadius: 4,
  },
  messageText: { fontSize: 16 },
  botText: { color: "#000" },
  userText: { color: "#fff" },
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