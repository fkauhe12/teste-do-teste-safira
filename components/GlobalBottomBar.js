import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const { height } = Dimensions.get('window');
const BAR_HEIGHT = Platform.OS === 'web' ? 70 : Platform.OS === 'ios' ? height * 0.14 : height * 0.16;
const CARD_SIZE = Platform.OS === 'web' ? 58 : Platform.OS === 'ios' ? 70 : 68;

export default function GlobalBottomBar({ currentRouteName, navigate }) {
  const insets = useSafeAreaInsets();
  const HIDE_ON = new Set(['Cart', 'LogScreen', 'LogCadastro', 'SAD']);
  
  if (HIDE_ON.has(currentRouteName)) return null;

  const items = [
    { 
      key: 'Home', 
      label: 'Home', 
      icon: (c) => <Ionicons name="home" size={24} color={c} />, 
      route: 'Home' 
    },
    { 
      key: 'Search', 
      label: 'Busca', 
      icon: (c) => <Ionicons name="search" size={24} color={c} />, 
      route: 'Search' 
    },
    { 
      key: 'SAD', 
      label: 'SAD', 
      icon: (c) => <FontAwesome5 name="hand-holding-heart" size={22} color={c} />, 
      route: 'SAD' 
    },
    { 
      key: 'Cart', 
      label: 'Cesta', 
      icon: (c) => <Ionicons name="basket-outline" size={24} color={c} />, 
      route: 'Cart' 
    },
    { 
      key: 'More', 
      label: 'Mais', 
      icon: (c) => <Ionicons name="menu" size={24} color={c} />, 
      route: 'More' 
    },
  ];

  return (
    <LinearGradient
      colors={['#1b46d6ff', '#09216dff', '#12235A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.bottomBar,    
        {
          height: BAR_HEIGHT + insets.bottom,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 4 : 8),
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
              {it.icon('#000')}
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
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
    zIndex: 100,
  },
  navItem: { 
    flex: 1, 
    alignItems: 'center' 
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  cardActive: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLabel: {
    fontSize: Platform.OS === 'web' ? 11 : 12,
    color: '#000',
    marginTop: 2,
  },
});