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

// Lista de telas onde a bottom bar deve ficar oculta
const HIDDEN_BOTTOM_BAR = new Set(["Loading", "Log", "LogCadastro"]);

export default function AppNavigator() {
  const [currentRoute, setCurrentRoute] = useState(null); // inicializa como null
  const navigationRef = useRef(null);

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <NavigationContainer
        ref={navigationRef}
        onStateChange={() => {
          const routeName = navigationRef.current?.getCurrentRoute()?.name;
          setCurrentRoute(routeName);
        }}
      >
        <Stack.Navigator
          initialRouteName="Loading"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: "transparent" }, // cards transparentes
          }}
        >
          <Stack.Screen name="Loading" component={LoadingScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{
              presentation: "transparentModal", // mantém a Home visível atrás
            }}
          />
          <Stack.Screen name="More" component={MoreScreen} />
          <Stack.Screen
            name="SAD"
            component={SadScreen}
            options={{
              presentation: "transparentModal", // mantém a Home visível atrás
            }}
          />

          {/* Tela de login como modal transparente */}
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

      {/* Renderiza a bottom bar apenas quando a rota atual não estiver na lista de telas ocultas */}
      {currentRoute && !HIDDEN_BOTTOM_BAR.has(currentRoute) && (
        <GlobalBottomBar
          currentRouteName={currentRoute}
          navigate={(name) => navigationRef.current?.navigate(name)}
        />
      )}
    </View>
  );
}
