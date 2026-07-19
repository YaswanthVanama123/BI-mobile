import React from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '@/theme';

export default function Screen({ children, loading, onRefresh, contentStyle }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[{ padding: 14, paddingBottom: insets.bottom + 32 }, contentStyle]}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!loading} onRefresh={onRefresh} tintColor={theme.colors.primary[600]} /> : undefined}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function SectionTitle({ children, style }) {
  return <Text style={[styles.sectionTitle, style]}>{children}</Text>;
}

export function Muted({ children, style }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.dark[700], marginBottom: 8, marginTop: 4 },
  muted: { fontSize: 12, color: theme.textMuted },
});
