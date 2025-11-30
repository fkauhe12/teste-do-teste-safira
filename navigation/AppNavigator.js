// navigation/AppNavigator.js
import React, { useState, useRef } from "react";
import { View, Platform, StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { CartProvider } from "../context/CartContext";

import HomeScreen from "../screens/HomeScreen";
import CartScreen from "../screens/CartScreen";
import MoreScreen from "../screens/MoreScreen";
import SearchScreen from "../screens/SearchScreen";
import SadScreen from "../screens/SadScreen";
import LogScreen from "../screens/LogScreen";
import LoadingScreen from "../screens/LoadingScreen";
import GlobalBottomBar from "../components/GlobalBottomBar";
import EditProfileScreen from "../screens/EditProfileScreen";
import ProductDetail from "../screens/ProductDetail";
import EntregaStatusScreen from "../screens/EntregaStatusScreen";
import AdminPanel from "../screens/AdminPanel";
import EntregadorMap from "../screens/EntregadorMap";
import MyOrdersScreen from "../screens/MyOrdersScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import AdminOrderDetail from "../screens/AdminOrderDetail"; // se ainda não tiver, pode remover

const Stack = createStackNavigator();

// Telas com STATUS BAR clara (ícones brancos)
const LIGHT_STATUS_BAR_ROUTES = new Set([
  "Home",
  "Search",
  "More",
  "SAD",
  "EntregaStatus",
  "Log",
  // se quiser, adicione outras telas com topo escuro
]);

// Telas que NÃO mostram a bottom bar
const HIDDEN_BOTTOM_BAR = new Set([
  "Loading",
  "Log",
  "LogCadastro",
  "Cart",
  "EditProfile",
  "ProductDetail",
  "EntregaStatus",
  "AdminPanel",
  "EntregadorMap",
  "MyOrders",
  "Notifications",
  "AdminOrderDetail",
]);

export default function AppNavigator() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);
  const navigationRef = useRef(null);

  if (!isAppReady) {
    return <LoadingScreen onFinish={() => setIsAppReady(true)} />;
  }

  const isLightStatus =
    currentRoute && LIGHT_STATUS_BAR_ROUTES.has(currentRoute);
  const barStyle = isLightStatus ? "light-content" : "dark-content";

  return (
    <CartProvider>
      <View style={{ flex: 1, backgroundColor: "transparent" }}>
        {/* STATUS BAR GLOBAL */}
        <StatusBar
          barStyle={barStyle}
          backgroundColor="transparent"
          translucent={true}
        />

        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            try {
              const routeName =
                navigationRef.current?.getCurrentRoute()?.name;
              setCurrentRoute(routeName || null);
            } catch {
              setCurrentRoute(null);
            }
          }}
          onStateChange={() => {
            try {
              const routeName =
                navigationRef.current?.getCurrentRoute()?.name;
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
            {/* Telas com bottom bar */}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="More" component={MoreScreen} />
            <Stack.Screen
              name="SAD"
              component={SadScreen}
              options={{ presentation: "transparentModal" }}
            />

            {/* Telas sem bottom bar */}
            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={
                Platform.OS === "ios"
                  ? {
                      presentation: "transparentModal",
                      cardStyle: { backgroundColor: "transparent" },
                    }
                  : {
                      // ANDROID -> tela normal, fundo branco
                      cardStyle: { backgroundColor: "#ffffff" },
                    }
              }
            />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetail} />
            <Stack.Screen
              name="EntregaStatus"
              component={EntregaStatusScreen}
            />
            <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
            />
            <Stack.Screen name="AdminPanel" component={AdminPanel} />
            <Stack.Screen name="EntregadorMap" component={EntregadorMap} />
            <Stack.Screen
              name="Log"
              component={LogScreen}
              options={
                Platform.OS === "ios"
                  ? {
                      presentation: "transparentModal",
                      cardStyle: { backgroundColor: "transparent" },
                    }
                  : {
                      cardStyle: { backgroundColor: "transparent" },
                    }
              }
            />
            <Stack.Screen
              name="AdminOrderDetail"
              component={AdminOrderDetail}
            />
          </Stack.Navigator>
        </NavigationContainer>

        {/* Bottom bar global - aparece em Home, Search, More, SAD */}
        {currentRoute && !HIDDEN_BOTTOM_BAR.has(currentRoute) && (
          <GlobalBottomBar
            currentRouteName={currentRoute}
            navigate={(name) => navigationRef.current?.navigate(name)}
          />
        )}
      </View>
    </CartProvider>
  );
}