
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

export default function App() {
  useEffect(() => {
    let cleanup = null;
    (async () => {
      try {
        const notifSvc = await import('./services/notifications');
        cleanup = await notifSvc.initLocalNotifications();
      } catch (e) {
        // ignore: service may not be available in some environments
      }
    })();
    return () => {
      if (cleanup && typeof cleanup === 'function') cleanup();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}