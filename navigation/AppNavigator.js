import React, { useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importando as telas
import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import MoreScreen from '../screens/MoreScreen';
import SearchScreen from '../screens/SearchScreen';
import SadScreen from '../screens/SadScreen';
import LogScreen from '../screens/LogScreen';
import LogCadastroScreen from '../screens/LogCadastroScreen';
import LoadingScreen from '../screens/LoadingScreen';

// Importando componentes
import GlobalBottomBar from '../components/GlobalBottomBar';

const Stack = createStackNavigator();

// Navigator principal do app
export default function AppNavigator() {
  const [currentRoute, setCurrentRoute] = useState('Home');
  const navigationRef = React.useRef(null);

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        onStateChange={() => {
          const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
          setCurrentRoute(currentRouteName);
        }}
      >
        <Stack.Navigator
          initialRouteName="Loading"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#fff' }
          }}
        >
          <Stack.Screen name="Loading" component={LoadingScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="More" component={MoreScreen} />
          <Stack.Screen name="SAD" component={SadScreen} />
          <Stack.Screen name="Log" component={LogScreen} />
          <Stack.Screen name="LogCadastro" component={LogCadastroScreen} />
        </Stack.Navigator>
      </NavigationContainer>

      <GlobalBottomBar
        currentRouteName={currentRoute}
        navigate={(name) => navigationRef.current?.navigate(name)}
      />
    </View>
  );
}