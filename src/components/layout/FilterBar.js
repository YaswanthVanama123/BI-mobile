import React from 'react';
import { View, StyleSheet } from 'react-native';
import theme from '@/theme';

export default function FilterBar({ children }) {
  return <View style={styles.bar}>{children}</View>;
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: theme.card,
    borderRadius: theme.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    padding: 12,
    marginBottom: 12,
    gap: 10,
    ...theme.shadow,
  },
});
