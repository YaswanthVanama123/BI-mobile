import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import theme from '@/theme';

export default function SearchInput({ label, value, onChangeText, placeholder = 'Search…' }) {
  return (
    <View style={{ flex: 1 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textFaint}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '700', color: theme.colors.dark[500], textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 },
  input: { backgroundColor: theme.card, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: theme.text },
});
