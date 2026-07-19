import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme, { tone as toneMap } from '@/theme';

export default function Badge({ children, tone = 'neutral', style }) {
  const t = toneMap[tone] || toneMap.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.text, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  text: { fontSize: 11.5, fontWeight: '600' },
});
