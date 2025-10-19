// LoadingScreen.js
import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Animated,
  Image,
  Text,
  Easing,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const logo = require("./assets/Logo_safira.png");

export default function LoadingScreen({ onFinish }) {
  const fadeContent = useRef(new Animated.Value(0)).current; // logo+texto
  const spinValue = useRef(new Animated.Value(0)).current;   // rotação
  const containerFade = useRef(new Animated.Value(1)).current; // gradiente final

  // 🔁 rotação infinita
  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();
    return () => spinLoop.stop();
  }, [spinValue]);

  // 🎬 sequência visual principal
  useEffect(() => {
    Animated.sequence([
      // Fade‑in inicial do conteúdo
      Animated.timing(fadeContent, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.delay(1600),
      // Fade‑out suave apenas do conteúdo
      Animated.timing(fadeContent, {
        toValue: 0,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      // Fade‑out leve do container completo (gradiente + tudo)
      Animated.timing(containerFade, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => onFinish && onFinish());
  }, [fadeContent, containerFade, onFinish]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={[styles.wrapper, { opacity: containerFade }]}>
      <LinearGradient
        colors={["#0E2E98", "#1C3DB8", "#4873FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Spinner rotativo */}
        <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />

        {/* Logo + Texto com fade controlado */}
        <Animated.View style={{ alignItems: "center", opacity: fadeContent }}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.text}>SAFIRA</Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#0E2E98",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    position: "absolute",
    width: width * 0.4,
    height: width * 0.4,
    borderWidth: 6,
    borderColor: "#fff",
    borderTopColor: "#4873FF",
    borderRadius: width * 0.2,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginBottom: 20,
  },
  text: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 4,
  },
});