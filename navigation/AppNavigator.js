// navigation/AppNavigator.js
import React, { useState, useRef } from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import HomeScreen from "../screens/HomeScreen";
import CartScreen from "../screens/CartScreen";
import MoreScreen from "../screens/MoreScreen";
import SearchScreen from "../screens/SearchScreen";
import SadScreen from "../screens/SadScreen";
import LogScreen from "../screens/LogScreen";
import LoadingScreen from "../screens/LoadingScreen";
import GlobalBottomBar from "../components/GlobalBottomBar";

const Stack = createStackNavigator();

// telas que não devem exibir a bottom bar
const HIDDEN_BOTTOM_BAR = new Set(["Loading", "Log", "LogCadastro"]);

export default function AppNavigator() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);
  const navigationRef = useRef(null);

  // 🔹 Se o app ainda não carregou, mostra apenas LoadingScreen
  if (!isAppReady) {
    // Passa callback para LoadingScreen sinalizar quando o app estiver pronto
    return <LoadingScreen onFinish={() => setIsAppReady(true)} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <NavigationContainer
        ref={navigationRef}
        onStateChange={() => {
          try {
            const routeName = navigationRef.current?.getCurrentRoute()?.name;
            setCurrentRoute(routeName || null);
          } catch {
            setCurrentRoute(null);
          }
        }}
      >
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{ presentation: "transparentModal" }}
          />
          <Stack.Screen name="More" component={MoreScreen} />
          <Stack.Screen
            name="SAD"
            component={SadScreen}
            options={{ presentation: "transparentModal" }}
          />
          <Stack.Screen
            name="Log"
            component={LogScreen}
            options={{
              presentation: "transparentModal",
              cardStyle: { backgroundColor: "transparent" },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Renderiza bottom bar só após carregar */}
      {currentRoute && !HIDDEN_BOTTOM_BAR.has(currentRoute) && (
        <GlobalBottomBar
          currentRouteName={currentRoute}
          navigate={(name) => navigationRef.current?.navigate(name)}
        />
      )}
    </View>
  );
}