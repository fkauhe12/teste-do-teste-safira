import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Easing,
  StatusBar,
  Platform,
  View,
  TouchableOpacity,
  Text,
  Dimensions,
} from "react-native";
import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

// ⚠️ fallback BlurView
let BlurView;
try {
  BlurView = require("expo-blur").BlurView;
} catch {
  BlurView = () => (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }]}
    />
  );
}

// Telas
import HomeScreen from "./HomeScreen";
import CartScreen from "./CartScreen";
import MoreScreen from "./MoreScreen";
import LogCadastroScreen from "./LogCadastroScreen";
import LogScreen from "./LogScreen";
import SearchScreen from "./SearchScreen";
import SadScreen from "./SadScreen";
import LoadingScreen from "./LoadingScreen"; // ✅ correto: arquivo no mesmo nível do App.js

const Stack = createStackNavigator();
const { height } = Dimensions.get("window");

const BAR_HEIGHT =
  Platform.OS === "web" ? 70 : Platform.OS === "ios" ? height * 0.12 : height * 0.14;
const CARD_SIZE =
  Platform.OS === "web" ? 58 : Platform.OS === "ios" ? 70 : 68;

// 🔧 Função segura de interpolação (Web + nativo)
const safeInterpolate = (progress, inputRange, outputRange) => {
  if (progress && typeof progress.interpolate === "function") {
    return progress.interpolate({ inputRange, outputRange });
  }
  const t = Math.min(Math.max(progress || 1, 0), 1);
  return outputRange[0] + (outputRange[1] - outputRange[0]) * t;
};

export default function App() {
  const [ready, setReady] = useState(false);
  const navRef = useNavigationContainerRef();
  const [currentRoute, setCurrentRoute] = useState(null);

  // Simula carregamento inicial
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const onReady = () => setCurrentRoute(navRef.getCurrentRoute()?.name);
  const onStateChange = () => setCurrentRoute(navRef.getCurrentRoute()?.name);

  const renderOverlay = () => {
    if (Platform.OS === "web") {
      return (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)" }]}
        />
      );
    }
    return <BlurView intensity={100} style={StyleSheet.absoluteFill} tint="dark" />;
  };

  // 🌟 Zoom‑in suave global
  const gentleZoomIn = {
    cardStyleInterpolator: ({ current }) => {
      const scale = safeInterpolate(current.progress, [0, 1], [0.97, 1]);
      const opacity = safeInterpolate(current.progress, [0, 1], [0, 1]);
      return { cardStyle: { transform: [{ scale }], opacity } };
    },
    transitionSpec: {
      open: {
        animation: "timing",
        config: { duration: 600, easing: Easing.out(Easing.exp) },
      },
      close: {
        animation: "timing",
        config: { duration: 450, easing: Easing.in(Easing.exp) },
      },
    },
  };

  // Enquanto não estiver pronto, exibe tela de loading
  if (!ready) return <LoadingScreen onFinish={() => setReady(true)} />;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <NavigationContainer
          ref={navRef}
          onReady={onReady}
          onStateChange={onStateChange}
        >
          <StatusBar barStyle="light-content" />
          <Stack.Navigator
            screenOptions={{ headerShown: false, gestureEnabled: true, ...gentleZoomIn }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="More" component={MoreScreen} />

            {/* SAD */}
            <Stack.Screen
              name="SAD"
              component={SadScreen}
              options={{
                presentation: "transparentModal",
                cardOverlayEnabled: true,
                cardStyleInterpolator:
                  Platform.OS === "ios"
                    ? CardStyleInterpolators.forVerticalIOS
                    : ({ current, layouts }) => ({
                        cardStyle: {
                          transform: [
                            {
                              translateY: safeInterpolate(
                                current.progress,
                                [0, 1],
                                [layouts.screen.height, 0]
                              ),
                            },
                          ],
                          opacity: current.progress,
                        },
                        overlayStyle: {
                          opacity: safeInterpolate(current.progress, [0, 1], [0, 0.5]),
                        },
                      }),
                transitionSpec: {
                  open: {
                    animation: "timing",
                    config: { duration: 400, easing: Easing.out(Easing.ease) },
                  },
                  close: {
                    animation: "timing",
                    config: { duration: 350, easing: Easing.in(Easing.ease) },
                  },
                },
              }}
            />

            {/* Cart */}
            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={{
                presentation: "transparentModal",
                cardOverlayEnabled: true,
                cardStyleInterpolator:
                  Platform.OS === "ios"
                    ? CardStyleInterpolators.forVerticalIOS
                    : ({ current, layouts }) => ({
                        cardStyle: {
                          transform: [
                            {
                              translateY: safeInterpolate(
                                current.progress,
                                [0, 1],
                                [layouts.screen.height, 0]
                              ),
                            },
                          ],
                          opacity: current.progress,
                        },
                        overlayStyle: {
                          opacity: safeInterpolate(current.progress, [0, 1], [0, 0.5]),
                        },
                      }),
                transitionSpec: {
                  open: {
                    animation: "timing",
                    config: { duration: 400, easing: Easing.out(Easing.ease) },
                  },
                  close: {
                    animation: "timing",
                    config: { duration: 350, easing: Easing.in(Easing.ease) },
                  },
                },
              }}
            />

            {/* LogScreen */}
            <Stack.Screen
              name="LogScreen"
              component={LogScreen}
              options={{
                presentation: "transparentModal",
                cardOverlayEnabled: true,
                gestureEnabled: true,
                cardOverlay: renderOverlay,
                ...gentleZoomIn,
              }}
            />

            {/* LogCadastro */}
            <Stack.Screen
              name="LogCadastro"
              component={LogCadastroScreen}
              options={{
                presentation: "transparentModal",
                cardOverlayEnabled: true,
                ...gentleZoomIn,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>

        <GlobalBottomBar
          currentRouteName={currentRoute}
          navigate={(name) => navRef?.navigate(name)}
        />
      </View>
    </SafeAreaProvider>
  );
}

// ----------------------------------------------------------------
// Barra inferior
function GlobalBottomBar({ currentRouteName, navigate }) {
  const insets = useSafeAreaInsets();
  const HIDE_ON = new Set(["Cart", "LogScreen", "LogCadastro", "SAD"]);
  if (HIDE_ON.has(currentRouteName)) return null;

  const items = [
    { key: "Home", label: "Home", icon: (c) => <Ionicons name="home" size={24} color={c} />, route: "Home" },
    { key: "Search", label: "Busca", icon: (c) => <Ionicons name="search" size={24} color={c} />, route: "Search" },
    { key: "SAD", label: "SAD", icon: (c) => <FontAwesome5 name="hand-holding-heart" size={22} color={c} />, route: "SAD" },
    { key: "Cart", label: "Cesta", icon: (c) => <Ionicons name="basket-outline" size={24} color={c} />, route: "Cart" },
    { key: "More", label: "Mais", icon: (c) => <Ionicons name="menu" size={24} color={c} />, route: "More" },
  ];

  return (
    <LinearGradient
      colors={["#264AC0", "#1C368D", "#12235A"]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.bottomBar,
        {
          height: BAR_HEIGHT + insets.bottom,
          paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 4 : 8),
        },
      ]}
    >
      {items.map((it) => {
        const isActive = currentRouteName === it.key;
        return (
          <TouchableOpacity
            key={it.key}
            style={styles.navItem}
            activeOpacity={0.85}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => navigate(it.route)}
          >
            <View style={[styles.card, isActive && styles.cardActive]}>
              {it.icon("#000")}
              <Text style={styles.cardLabel}>{it.label}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: "hidden",
    zIndex: 100,
  },
  navItem: { flex: 1, alignItems: "center" },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  cardActive: {
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLabel: {
    fontSize: Platform.OS === "web" ? 11 : 12,
    color: "#000",
    marginTop: 2,
  },
});