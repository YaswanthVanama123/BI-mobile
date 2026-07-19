import React from 'react';
import { View, StyleSheet } from 'react-native';
import theme from '@/theme';

export default function Card({ children, style, padded = true }) {
  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: theme.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    ...theme.shadow,
  },
  padded: { padding: 14 },
});
