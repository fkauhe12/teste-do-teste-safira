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

const logo = require("../assets/images/Logo_safira.png");

export default function LoadingScreen({ navigation }) {
  const fadeSpinner = useRef(new Animated.Value(1)).current; // controle do spinner
  const fadeLogo = useRef(new Animated.Value(0)).current; // controle do fade da logo
  const spinValue = useRef(new Animated.Value(0)).current; // rotação da borda
  const pulseValue = useRef(new Animated.Value(1)).current; // efeito "zoom" da logo
  const containerFade = useRef(new Animated.Value(1)).current;

  // 🔁 rotação infinita do círculo
  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();
    return () => spinLoop.stop();
  }, [spinValue]);

  // 💓 efeito de "zoom pulsante" (sobe e desce o scale)
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseValue]);

  // 🎬 sequência de transição
  useEffect(() => {
    Animated.sequence([
      Animated.delay(1500), // mostra o spinner sozinho
      Animated.parallel([
        Animated.timing(fadeSpinner, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fadeLogo, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1800),
      Animated.timing(containerFade, {
        toValue: 0,
        duration: 600,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => navigation.replace("Home"));
  }, [fadeSpinner, fadeLogo, containerFade, navigation]);

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
        {/* 🔵 Spinner (roda primeiro) */}
        <Animated.View
          style={[
            styles.spinner,
            {
              opacity: fadeSpinner,
              transform: [{ rotate: spin }],
            },
          ]}
        />

        {/* 💠 Logo redonda com efeito pulsante */}
        <Animated.View
          style={{
            alignItems: "center",
            opacity: fadeLogo,
            transform: [{ scale: pulseValue }],
          }}
        >
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
    width: width * 0.35,
    height: width * 0.35,
    borderWidth: 6,
    borderColor: "#fff",
    borderTopColor: "#4873FF",
    borderRadius: width * 0.175,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70, // redonda
    resizeMode: "cover",
    marginBottom: 20,
  },
  text: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 4,
  },
});
