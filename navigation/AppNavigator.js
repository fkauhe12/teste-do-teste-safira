// navigation/AppNavigator.js
import React, { useState, useRef } from "react";
import { View, Platform } from "react-native";
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


const Stack = createStackNavigator();

// telas que não devem exibir a bottom bar
const HIDDEN_BOTTOM_BAR = new Set(["Loading", "Log", "LogCadastro", "SAD", "Cart", "EditProfile", "ProductDetail", "EntregaStatus"]);

export default function AppNavigator() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);
  const navigationRef = useRef(null);

  // Se o app ainda não carregou, mostra apenas LoadingScreen
  if (!isAppReady) {
    // Passa callback para LoadingScreen sinalizar quando o app estiver pronto
    return <LoadingScreen onFinish={() => setIsAppReady(true)} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <CartProvider>
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
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />

            <Stack.Screen name="ProductDetail" component={ProductDetail} />
            <Stack.Screen name="EntregaStatus" component={EntregaStatusScreen} />
            <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="AdminPanel" component={AdminPanel} />
            <Stack.Screen name="EntregadorMap" component={EntregadorMap} />

            <Stack.Screen
              name="SAD"
              component={SadScreen}
              options={{ presentation: "transparentModal" }}
            />
            <Stack.Screen
              name="Log"
              component={LogScreen}
              options={
                Platform.OS === 'ios'
                  ? {
                      presentation: 'transparentModal',
                      cardStyle: { backgroundColor: 'transparent' },
                    }
                  : {
                      cardStyle: { backgroundColor: 'transparent' },
                    }
              }
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
      </CartProvider>
    </View>
  );
}