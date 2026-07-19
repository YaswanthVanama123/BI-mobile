import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from '@/app/navigation/RootNavigator';
import { FiltersProvider } from '@/context/FiltersContext';
import theme from '@/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <FiltersProvider>
          <StatusBar barStyle="dark-content" backgroundColor={theme.card} />
          <RootNavigator />
        </FiltersProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
