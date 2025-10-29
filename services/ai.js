import Constants from "expo-constants";

const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY ||
  "";

const GEMINI_MODEL = "gemini-2.5-flash-lite";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function getAIResponse(prompt) {
  try {
    const body = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Erro na API Gemini:", data);
      throw new Error(data.error?.message || "Erro ao conectar com Gemini");
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Agora não removemos ** para permitir negrito
    return content.trim() || "Desculpe, não consegui entender sua pergunta.";
  } catch (err) {
    console.error("Erro Gemini:", err.message);
    return "Ops! Houve um problema ao gerar a resposta 😢 Tente novamente.";
  }
}